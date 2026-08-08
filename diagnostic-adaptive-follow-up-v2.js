import { createAdaptiveFollowUpV2 } from "./diagnostic-protocol-engine-v2.js";

const EXAMPLE_CUES=/\b(for example|for instance|recently|when|during|last|specific|case|incident)\b/i;
const CONSEQUENCE_CUES=/\b(result|because|therefore|led to|caused|impact|consequence|delayed|increased|decreased|risk|cost)\b/i;
const ALTERNATIVE_CUES=/\b(alternative|another explanation|however|although|could also|might instead|counterexample|not always)\b/i;

export function planAdaptiveFollowUpsV2({protocol,interviewInstanceId,answers,existingFollowUps=[]},options={}){
  if(!Array.isArray(answers)||!answers.length)return Object.freeze([]);
  if(existingFollowUps.length)return Object.freeze(existingFollowUps);
  const byId=new Map(answers.map(answer=>[answer.questionId,String(answer.answerText||"").trim()]));
  const plans=[];
  const add=(questionId,promptType,triggerReason)=>{if(plans.length>=3||plans.some(item=>item.questionId===questionId))return;plans.push(createAdaptiveFollowUpV2(protocol,{interviewInstanceId,questionId,promptType,triggerReason},plans,{id:options.id?options.id(plans.length):undefined,now:options.now}));};
  const shortest=[...protocol.questions].filter(question=>byId.has(question.questionId)).sort((a,b)=>byId.get(a.questionId).length-byId.get(b.questionId).length);
  const exampleTarget=shortest.find(question=>byId.get(question.questionId).length<280||!EXAMPLE_CUES.test(byId.get(question.questionId)));
  if(exampleTarget)add(exampleTarget.questionId,"example","The response would be stronger with one recent observable example.");
  const consequenceTarget=shortest.find(question=>!plans.some(item=>item.questionId===question.questionId)&&!CONSEQUENCE_CUES.test(byId.get(question.questionId)));
  if(consequenceTarget)add(consequenceTarget.questionId,"consequence","The response does not yet trace the operating or execution consequence.");
  if(!answers.some(answer=>ALTERNATIVE_CUES.test(String(answer.answerText||"")))){
    const alternativeTarget=[...protocol.questions].filter(question=>byId.has(question.questionId)&&!plans.some(item=>item.questionId===question.questionId)).sort((a,b)=>byId.get(b.questionId).length-byId.get(a.questionId).length)[0];
    if(alternativeTarget)add(alternativeTarget.questionId,"alternative-explanation","The evidence set needs an explicit competing explanation or boundary test.");
  }
  return Object.freeze(plans);
}

export const adaptiveFollowUpPolicyV2=Object.freeze({maximumFollowUpsPerInterview:3,maximumFollowUpsPerQuestion:1,coreProtocolMutable:false,participantMaySkip:false,modelGeneratedPrompts:false});
