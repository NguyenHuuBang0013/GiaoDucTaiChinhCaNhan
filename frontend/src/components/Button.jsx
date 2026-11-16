import React from 'react';
export default function Button({children,onClick,kind='primary',disabled=false,type='button',className='',...props}){
 return <button type={type} disabled={disabled} className={`btn ${kind==='outline'?'outline':kind==='danger'?'danger':''} ${className}`.trim()} onClick={onClick} {...props}>{children}</button>;
}
