const n=()=>{if(typeof window>"u")return!1;const e=window.matchMedia("(hover: hover)").matches,o=window.matchMedia("(pointer: coarse)").matches;return!e&&o},s=()=>n();export{n as i,s};
