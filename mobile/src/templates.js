export const choices = ['Instagram','TikTok','Facebook','X','Email','Website','General'];
export const sampleTasks = [
  {title:'7-day content calendar',goal:'Create seven helpful promotional post concepts with captions, visual directions, and an invitation to take action.',platform:'Instagram'},
  {title:'Audience and competitor research',goal:'Create a research plan, possible audience segments, a competitor comparison checklist, and questions to validate.',platform:'General'},
  {title:'Product launch campaign',goal:'Draft an introductory campaign with a clear offer, three messages, and a simple distribution plan.',platform:'Facebook'},
];
export function starterDraft(task,business,brief){
 const b=business?.trim() || 'your business';
 const p=task.platform||'your chosen channel';
 return ['LOCAL STARTER DRAFT — template only, not AI-generated research or platform activity.',
'',
'CAMPAIGN',task.title,'Business: '+b,'Channel: '+p,'Objective: '+(task.goal||'Introduce the business to the right audience.'),'',
'POST / CAMPAIGN CONCEPT','Headline: Discover what makes '+b+' different.',
'Caption draft: Looking for a thoughtful option? Here is what we are working on at '+b+'. [Add one verified customer benefit]. [Add one factual feature]. Explore the collection and tell us what you would love to see next.',
'Visual direction: Showcase the product or service clearly with one headline and one call to action.',
'Call to action: Learn more / View the collection.','',
'SUGGESTED NEXT STEPS','1. Replace brackets with truthful product details.','2. Match your brand voice.',
'3. Review platform rules and image dimensions.','4. Submit the exact text for approval before publishing.','',
'FACTS TO CHECK','Pricing, availability, benefits, linked pages, brand voice and audience fit.','',
'APPROVAL','No account access, publishing, sending, or ad spending took place.','',
'BRAND NOTES',(brief||'Add business details in Profile to improve future drafts.').slice(0,650)].join('\n');
}
export const atTime=t=>new Date(t).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
