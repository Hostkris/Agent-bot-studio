import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
const KEY='agent-bot-studio-v1';
export const initialData = {
  botName:'Mira', business:'My business', brief:'', tasks:[],
  messages:[{id:'welcome',role:'assistant',content:"I'm Mira, your Marketing Agent. Give me a goal and I'll help plan campaigns, research your market, or draft content.\n\nFor live Grok responses, connect the backend in Settings. Until then, Tasks can generate clearly labeled local starter drafts.",at:Date.now()}],
  activity:[],apiUrl:''
};
export async function readApp(){
 try {const raw=await AsyncStorage.getItem(KEY); const p=raw?JSON.parse(raw):{}; return {...initialData,...p};}
 catch{return {...initialData}}
}
export async function writeApp(data){await AsyncStorage.setItem(KEY,JSON.stringify(data))}
export async function readToken(){try{return await SecureStore.getItemAsync('agent-bot-studio-token')||''}catch{return ''}}
export async function writeToken(t){if(t)await SecureStore.setItemAsync('agent-bot-studio-token',t);else await SecureStore.deleteItemAsync('agent-bot-studio-token')}
