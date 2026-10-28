/* The alpha build sorts the player behind the level backdrop. Keep the original
   body-part order on its own layer so the rig remains visible. */
runOnStartup(runtime=>runtime.addEventListener('beforeprojectstart',()=>{
 const names=["Body", "Head", "LeftArm", "LeftFoot", "LeftHand", "LeftLeg", "RightArm", "RightFoot", "RightHand", "RightLeg"];
 runtime.addEventListener('tick',()=>{
  const parts=names.flatMap(name=>runtime.objects[name].getAllInstances());
  parts.sort((a,b)=>a.instVars.Zordering-b.instVars.Zordering);
  for(const part of parts)part.moveToTop();
 });
}));
