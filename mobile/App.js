import React, {useEffect,useState,useRef} from 'react';
import {SafeAreaView,StatusBar,KeyboardAvoidingView,Platform,ScrollView,View,Text,TextInput,Pressable,ActivityIndicator,Alert,StyleSheet} from 'react-native';
import {palette as C} from './src/theme';
import {initialData,readApp,writeApp,readToken,writeToken} from './src/storage';
import {choices,sampleTasks,starterDraft} from './src/templates';
import {runAgent,checkServer} from './src/client';

const uid=()=>String(Date.now())+'-'+Math.random().toString(36).slice(2,9);
const tabs=['Chat','Tasks','Approvals','Profile','Settings'];
const now=()=>Date.now();
const stateLabel={queued:'Queued',working:'Preparing',draft:'Draft ready',pending:'Awaiting approval',approved:'Draft approved',rejected:'Draft rejected'};
const time=(ms)=>new Date(ms||now()).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});

function TextButton({title,onPress,secondary=false,disabled=false}){
 return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled} onPress={onPress} style={[styles.button,secondary&&styles.secondary,disabled&&{opacity:.4}]}>
   <Text style={[styles.buttonText,secondary&&{color:C.text}]}>{title}</Text>
 </Pressable>;
}
function Panel({children}){return <View style={styles.panel}>{children}</View>}
function Field({title,value,onChangeText,placeholder,multiline=false,secret=false}){
 return <View style={{marginBottom:14}}>
   <Text style={styles.label}>{title}</Text>
   <TextInput style={[styles.field,multiline&&{height:105,textAlignVertical:'top'}]} value={value} onChangeText={onChangeText}
    placeholder={placeholder} placeholderTextColor={C.muted} multiline={multiline} secureTextEntry={secret}
    autoCapitalize={secret?'none':'sentences'} autoCorrect={!secret}/>
 </View>;
}
function Heading({title,subtitle}){return <View style={{marginBottom:14}}><Text style={styles.heading}>{title}</Text><Text style={styles.muted}>{subtitle}</Text></View>;}

export default function App(){
 const [data,setData]=useState(initialData);
 const [ready,setReady]=useState(false);
 const [tab,setTab]=useState('Chat');
 const [access,setAccess]=useState('');
 const [accessDraft,setAccessDraft]=useState('');
 const [serverDraft,setServerDraft]=useState('');
 const [message,setMessage]=useState('');
 const [newTitle,setNewTitle]=useState('');
 const [newGoal,setNewGoal]=useState('');
 const [platform,setPlatform]=useState('Instagram');
 const [selected,setSelected]=useState(null);
 const [busy,setBusy]=useState(false);
 const [info,setInfo]=useState('');
 const messagesRef=useRef(null);
 useEffect(()=>{
   let mounted=true;
   Promise.all([readApp(),readToken()]).then(([saved,token])=>{
     if(!mounted)return;
     setData(saved);setAccess(token);setAccessDraft(token);
     setServerDraft(saved.apiUrl||'');setReady(true);
   }).catch(()=>setReady(true));
   return ()=>{mounted=false};
 },[]);
 useEffect(()=>{if(ready)writeApp(data).catch(()=>{});},[data,ready]);
 const patch=x=>setData(prev=>({...prev,...x}));
 const updateTask=(id,updates)=>setData(prev=>({...prev,tasks:prev.tasks.map(t=>t.id===id?{...t,...updates}:t)}));
 const activity=text=>setData(prev=>({...prev,activity:[{id:uid(),detail:text,at:now()},...(prev.activity||[])].slice(0,60)}));
 const connected=Boolean(data.apiUrl&&access);
 const current=data.tasks.find(t=>t.id===selected);
 const pending=data.tasks.filter(t=>t.status==='pending');
 const addTask=(task)=>{
   if(!task.title?.trim()){Alert.alert('Missing title','Enter a short name for the assignment.');return;}
   const item={id:uid(),title:task.title.trim().slice(0,160),goal:(task.goal||'').slice(0,1200),
     platform:task.platform||'General',status:'queued',draft:'',source:'',createdAt:now()};
   setData(prev=>({...prev,tasks:[item,...prev.tasks],activity:[{id:uid(),detail:'Assigned: '+item.title,at:now()},...(prev.activity||[])].slice(0,60)}));
   setSelected(item.id);setNewTitle('');setNewGoal('');
 };
 async function send(){
   const text=message.trim();
   if(!text||busy)return;
   if(!connected){Alert.alert('Connect your Grok server','Open Settings to enter your API server and access token.');setTab('Settings');return;}
   const user={id:uid(),role:'user',content:text,at:now()};
   setData(prev=>({...prev,messages:[...prev.messages,user]}));setMessage('');setBusy(true);
   try{
     const history=[...data.messages.filter(m=>m.role==='user'||(m.role==='assistant'&&m.id!=='welcome')),user];
     const result=await runAgent({url:data.apiUrl,token:access,brandBrief:'Business: '+data.business+'. '+data.brief,
       messages:history.map(m=>({role:m.role,content:m.content})),search:true});
     setData(prev=>({...prev,messages:[...prev.messages,{id:uid(),role:'assistant',content:result.answer,at:now()}],
       activity:[{id:uid(),detail:'Marketing chat completed',at:now()},...(prev.activity||[])].slice(0,60)}));
   }catch(e){
     setData(prev=>({...prev,messages:[...prev.messages,{id:uid(),role:'error',content:e.message,at:now()}]}));
   }finally{setBusy(false);}
 }
 async function prepare(task){
   if(busy)return;
   setBusy(true);updateTask(task.id,{status:'working'});
   try{
     const output=connected?await runAgent({url:data.apiUrl,token:access,
       brandBrief:'Business: '+data.business+'. '+data.brief,task,search:true})
       :{answer:starterDraft(task,data.business,data.brief)};
     setData(prev=>({...prev,tasks:prev.tasks.map(t=>t.id===task.id?
       {...t,status:'draft',draft:output.answer,source:connected?'grok':'local-template'}:t),
       activity:[{id:uid(),detail:(connected?'AI draft':'Local starter draft')+' prepared: '+task.title,at:now()},...(prev.activity||[])].slice(0,60)}));
   }catch(e){updateTask(task.id,{status:'queued'});Alert.alert('Could not generate draft',e.message);}
   finally{setBusy(false);}
 }
 function decide(task,approved){
   updateTask(task.id,{status:approved?'approved':'rejected',approvalAt:now()});
   activity((approved?'Approved':'Rejected')+' draft: '+task.title+' (no external action)');
 }
 async function saveConnection(){
   try{
     await writeToken(accessDraft.trim());
     setAccess(accessDraft.trim());
     patch({apiUrl:serverDraft.trim().replace(/\/+$/,'')});
     setInfo('Saved. Test server to verify the connection.');
   }catch(e){Alert.alert('Save failed',e.message);}
 }
 async function testConnection(){
   setBusy(true);
   try{const r=await checkServer(serverDraft);setInfo(r.ok?'Server reachable. Grok API: '+(r.aiConfigured?'configured':'not configured'):'Server returned an error');}
   catch(e){setInfo('Connection failed: '+e.message);}
   finally{setBusy(false);}
 }
 if(!ready)return <SafeAreaView style={styles.page}><ActivityIndicator style={{marginTop:90}} color={C.teal}/></SafeAreaView>;
 return <SafeAreaView style={styles.page}>
   <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
   <View style={styles.header}>
     <View style={styles.logo}><Text style={{color:C.bg,fontSize:23,fontWeight:'900'}}>A</Text></View>
     <View style={{flex:1}}>
       <Text style={styles.headerTitle}>AGENT BOT STUDIO</Text>
       <Text style={styles.muted}>Marketing Agent · Milestone 01</Text>
     </View>
     <Text style={[styles.status,{color:connected?C.teal:C.amber}]}>{connected?'API SET':'LOCAL'}</Text>
   </View>
   <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
    {tab==='Chat'&&<View style={{flex:1}}>
      <View style={styles.agent}>
        <View style={styles.avatar}><Text style={{color:C.teal,fontSize:26,fontWeight:'900'}}>M</Text></View>
        <View style={{flex:1}}><Text style={styles.agentName}>{data.botName||'Mira'} ✧</Text>
          <Text style={styles.muted}>Marketing strategist · Research & creative</Text></View>
        <Text style={styles.status}>BOT 01</Text>
      </View>
      <ScrollView ref={messagesRef} onContentSizeChange={()=>messagesRef.current?.scrollToEnd({animated:true})}
        contentContainerStyle={{padding:14,paddingBottom:22}}>
        {data.messages.map(m=><View key={m.id} style={[styles.bubble,m.role==='user'?styles.userBubble:styles.agentBubble]}>
          <Text style={styles.label}>{m.role==='user'?'YOU':m.role==='error'?'ERROR':(data.botName||'MIRA').toUpperCase()} · {time(m.at)}</Text>
          <Text selectable style={styles.body}>{m.content}</Text>
        </View>)}
        {busy&&<ActivityIndicator color={C.teal}/>}
        {data.messages.length===1&&<View style={{marginTop:12}}>
          {['Plan a 7-day Instagram campaign','Research my target customer','Write three launch captions'].map(x=>
            <Pressable key={x} onPress={()=>setMessage(x)} style={styles.option}><Text style={styles.body}>{x} ↗</Text></Pressable>)}
        </View>}
      </ScrollView>
      <View style={styles.compose}><TextInput multiline value={message} onChangeText={setMessage} maxLength={4000}
        placeholder="Message your marketing agent…" placeholderTextColor={C.muted} style={styles.composeInput}/>
        <TextButton title="↑" onPress={send} disabled={!message.trim()||busy}/></View>
      <Text style={styles.notice}>Drafts only. Publishing and spending are not connected.</Text>
    </View>}
    {tab==='Tasks'&&<ScrollView contentContainerStyle={styles.section} keyboardShouldPersistTaps="handled">
      <Heading title="Assignments" subtitle="Create a job for your marketing specialist."/>
      <Panel>
        <Text style={styles.cardTitle}>New marketing assignment</Text>
        <Field title="TASK NAME" value={newTitle} onChangeText={setNewTitle} placeholder="e.g. October product launch"/>
        <Field title="GOAL" value={newGoal} onChangeText={setNewGoal} placeholder="What should the agent prepare?" multiline/>
        <Text style={styles.label}>CHANNEL</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:14}}>
          {choices.map(c=><Pressable key={c} onPress={()=>setPlatform(c)}
            style={[styles.pill,platform===c&&styles.pillOn]}><Text style={{color:platform===c?C.bg:C.text}}>{c}</Text></Pressable>)}
        </ScrollView>
        <TextButton title="Add assignment" onPress={()=>addTask({title:newTitle,goal:newGoal,platform})}/>
      </Panel>
      <Text style={styles.cardTitle}>Quick-start templates</Text>
      {sampleTasks.map(t=><Pressable key={t.title} style={styles.option} onPress={()=>addTask(t)}>
        <Text style={styles.body}>+ {t.title}</Text><Text style={styles.muted}>{t.platform}</Text>
      </Pressable>)}
      <Text style={styles.cardTitle}>Task queue · {data.tasks.length}</Text>
      {data.tasks.length===0&&<Text style={styles.muted}>No tasks yet. Choose a template to begin.</Text>}
      {data.tasks.map(t=><Panel key={t.id}>
        <Pressable onPress={()=>setSelected(selected===t.id?null:t.id)}>
          <Text style={styles.cardTitle}>{t.title}</Text>
          <Text style={styles.muted}>{t.platform} · {stateLabel[t.status]||t.status} {selected===t.id?'▴':'▾'}</Text>
        </Pressable>
        {selected===t.id&&<View style={{marginTop:12}}>
          <Text style={styles.body}>{t.goal||'No objective added.'}</Text>
          {Boolean(t.draft)&&<View style={styles.draft}><Text style={styles.label}>{t.source==='grok'?'GROK AI DRAFT':'LOCAL TEMPLATE'}</Text>
            <Text selectable style={styles.body}>{t.draft}</Text></View>}
          {(t.status==='queued'||t.status==='draft'||t.status==='rejected')&&<TextButton disabled={busy}
            title={connected?'Run Grok marketing agent':'Create local starter draft'} onPress={()=>prepare(t)}/>}
          {t.status==='draft'&&<View style={{marginTop:9}}><TextButton title="Request my approval"
            secondary onPress={()=>{updateTask(t.id,{status:'pending'});activity('Approval requested: '+t.title);}}/></View>}
          {t.status==='pending'&&<Text style={styles.notice}>Awaiting your decision in Approvals.</Text>}
          {t.status==='approved'&&<Text style={styles.notice}>Draft approved. No message has been sent or posted.</Text>}
        </View>}
      </Panel>)}
    </ScrollView>}
    {tab==='Approvals'&&<ScrollView contentContainerStyle={styles.section}>
      <Heading title="Approval center" subtitle="Review exact drafts before authorizing any action."/>
      {pending.length===0&&<Panel><Text style={styles.cardTitle}>No approvals waiting</Text>
        <Text style={styles.muted}>Create a task and request approval for its draft.</Text></Panel>}
      {pending.map(t=><Panel key={t.id}>
        <Text style={styles.cardTitle}>{t.title}</Text><Text style={styles.muted}>{t.platform} · Draft review</Text>
        <View style={styles.draft}><Text selectable style={styles.body}>{t.draft}</Text></View>
        <TextButton title="Approve draft only" onPress={()=>decide(t,true)}/>
        <View style={{marginTop:9}}><TextButton secondary title="Reject draft" onPress={()=>decide(t,false)}/></View>
      </Panel>)}
      <Panel><Text style={styles.cardTitle}>External actions are disabled</Text>
        <Text style={styles.muted}>Approval records your decision locally. It does NOT post content, access social accounts, send email, change ads or spend money.</Text></Panel>
    </ScrollView>}
    {tab==='Profile'&&<ScrollView contentContainerStyle={styles.section} keyboardShouldPersistTaps="handled">
      <Heading title="Employee profile" subtitle="One specialist now. Additional agents come later."/>
      <Panel>
        <Text style={styles.cardTitle}>{data.botName||'Mira'} · Marketing Agent</Text>
        <Field title="AGENT NAME" value={data.botName} onChangeText={x=>patch({botName:x.slice(0,50)})}/>
        <Field title="BUSINESS NAME" value={data.business} onChangeText={x=>patch({business:x.slice(0,120)})}/>
        <Field title="BRAND NOTES / PERSISTENT BRIEF" value={data.brief}
          onChangeText={x=>patch({brief:x.slice(0,6000)})}
          placeholder="Products, target customers, tone, offers and claims to avoid…" multiline/>
        <Text style={styles.notice}>Saved on this phone and included when requesting AI work. Do not store passwords or sensitive financial information here.</Text>
      </Panel>
      <Panel><Text style={styles.cardTitle}>Assigned responsibilities</Text>
        <Text style={styles.body}>Strategy, public research, drafting campaigns, social captions, content calendars and reviewing supplied marketing data.</Text>
        <Text style={styles.notice}>No private account access, publishing, messaging, billing or advertising changes.</Text>
      </Panel>
      <Panel><Text style={styles.cardTitle}>Recent activity</Text>
        {data.activity.length===0?<Text style={styles.muted}>No recorded actions yet.</Text>
          :data.activity.slice(0,12).map(a=><Text key={a.id} style={styles.muted}>• {a.detail} · {time(a.at)}</Text>)}
      </Panel>
    </ScrollView>}
    {tab==='Settings'&&<ScrollView contentContainerStyle={styles.section} keyboardShouldPersistTaps="handled">
      <Heading title="Connections" subtitle="A separate authenticated Node server connects the iPhone app to xAI."/>
      <Panel>
        <Text style={styles.cardTitle}>Grok via xAI API</Text>
        <Text style={styles.muted}>Your xAI API key stays on the server. Never enter it in this app or commit it to GitHub.</Text>
        <View style={{height:10}}/>
        <Field title="SERVER URL" value={serverDraft} onChangeText={setServerDraft}
          placeholder="https://your-server.example"/>
        <Field title="APP ACCESS TOKEN" value={accessDraft} onChangeText={setAccessDraft}
          placeholder="Private token from your server" secret/>
        <TextButton title="Save connection" onPress={saveConnection}/>
        <View style={{marginTop:9}}><TextButton secondary disabled={busy} title="Test server" onPress={testConnection}/></View>
        {Boolean(info)&&<Text style={[styles.muted,{marginTop:12}]}>{info}</Text>}
      </Panel>
      <Panel><Text style={styles.cardTitle}>Available now</Text>
        <Text style={styles.body}>✓ Marketing agent chat with configured backend</Text>
        <Text style={styles.body}>✓ Task queue and local starter drafts</Text>
        <Text style={styles.body}>✓ AI-generated draft on request</Text>
        <Text style={styles.body}>✓ Review decisions and activity history</Text>
        <Text style={styles.body}>✓ Saved business notes and secure token storage</Text>
      </Panel>
      <Panel><Text style={styles.cardTitle}>Future releases</Text>
        <Text style={styles.muted}>○ OAuth account connections</Text>
        <Text style={styles.muted}>○ Permission-gated publishing</Text>
        <Text style={styles.muted}>○ Scheduled background assignments</Text>
        <Text style={styles.muted}>○ Multiple independent agent employees</Text>
      </Panel>
      <Text style={[styles.notice,{marginTop:12}]}>Independent project · Not affiliated with Grok, xAI or OpenMausBot.</Text>
    </ScrollView>}
   </KeyboardAvoidingView>
   <View style={styles.nav}>{tabs.map((name,i)=><Pressable key={name} accessibilityRole="tab"
      accessibilityState={{selected:tab===name}} onPress={()=>setTab(name)} style={styles.navItem}>
       <Text style={{color:tab===name?C.teal:C.muted,fontSize:18}}>{['◉','▤','✓','♟','⚙'][i]}</Text>
       <Text style={{color:tab===name?C.teal:C.muted,fontSize:10,marginTop:3}}>{name}{name==='Approvals'&&pending.length?' ('+pending.length+')':''}</Text>
     </Pressable>)}</View>
 </SafeAreaView>;
}

const styles=StyleSheet.create({
 page:{flex:1,backgroundColor:C.bg},
 header:{padding:14,flexDirection:'row',alignItems:'center',gap:12,borderBottomWidth:1,borderBottomColor:C.border},
 logo:{width:40,height:40,borderRadius:12,backgroundColor:C.teal,alignItems:'center',justifyContent:'center'},
 headerTitle:{color:C.text,fontSize:12,fontWeight:'900',letterSpacing:1.8},
 status:{color:C.muted,fontSize:10,fontWeight:'800'},
 agent:{margin:13,padding:13,backgroundColor:C.surface,borderColor:C.border,borderWidth:1,borderRadius:18,flexDirection:'row',alignItems:'center',gap:12},
 avatar:{width:49,height:49,borderRadius:16,backgroundColor:'#234943',alignItems:'center',justifyContent:'center'},
 agentName:{fontSize:18,color:C.text,fontWeight:'800'},
 heading:{color:C.text,fontSize:26,fontWeight:'900',marginBottom:6},
 muted:{color:C.muted,fontSize:12,lineHeight:19},
 body:{color:C.text,fontSize:14,lineHeight:21},
 bubble:{maxWidth:'96%',borderRadius:17,padding:14,marginBottom:10},
 agentBubble:{backgroundColor:C.surface,alignSelf:'flex-start',borderTopLeftRadius:4},
 userBubble:{backgroundColor:'#1D403C',alignSelf:'flex-end',borderTopRightRadius:4},
 compose:{flexDirection:'row',alignItems:'center',gap:9,padding:12,backgroundColor:C.surface},
 composeInput:{flex:1,color:C.text,fontSize:14,maxHeight:90,minHeight:36},
 section:{padding:16,paddingBottom:50,gap:12},
 panel:{backgroundColor:C.surface,padding:16,borderRadius:17,borderColor:C.border,borderWidth:1},
 cardTitle:{color:C.text,fontSize:16,fontWeight:'800',marginBottom:9},
 label:{color:C.muted,fontSize:10,fontWeight:'800',letterSpacing:1,marginBottom:8},
 field:{color:C.text,backgroundColor:C.bg,borderWidth:1,borderColor:C.border,borderRadius:12,padding:12,minHeight:45,fontSize:14},
 button:{backgroundColor:C.teal,paddingHorizontal:14,paddingVertical:12,borderRadius:12,alignItems:'center',justifyContent:'center'},
 secondary:{backgroundColor:C.card,borderWidth:1,borderColor:C.border},
 buttonText:{color:C.bg,fontWeight:'900',fontSize:14},
 pill:{borderColor:C.border,borderWidth:1,borderRadius:20,paddingHorizontal:13,paddingVertical:9,marginRight:8,backgroundColor:C.card},
 pillOn:{backgroundColor:C.teal,borderColor:C.teal},
 option:{backgroundColor:C.surface,borderRadius:14,padding:14,borderWidth:1,borderColor:C.border},
 draft:{backgroundColor:C.bg,borderRadius:12,padding:12,marginVertical:14,borderWidth:1,borderColor:C.border},
 notice:{color:C.muted,fontSize:11,textAlign:'center',lineHeight:16,marginVertical:8},
 nav:{height:65,flexDirection:'row',borderTopWidth:1,borderTopColor:C.border,backgroundColor:C.bg},
 navItem:{flex:1,alignItems:'center',justifyContent:'center'}
});
