async function loadApprovedHero(){
  const target=document.getElementById('hero-master');
  if(!target)return;
  try{
    const files=Array.from({length:6},(_,i)=>`assets/hero-q40-${String(i).padStart(2,'0')}.txt`);
    const parts=await Promise.all(files.map(file=>fetch(`${file}?v=3`).then(response=>{if(!response.ok)throw new Error(`${file}: ${response.status}`);return response.text();})));
    const base64=parts.join('').replace(/\s+/g,'');
    const binary=atob(base64);
    const bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    const objectUrl=URL.createObjectURL(new Blob([bytes],{type:'image/webp'}));
    const probe=new Image();
    await new Promise((resolve,reject)=>{probe.onload=resolve;probe.onerror=reject;probe.src=objectUrl;});
    if(probe.naturalWidth<1400||probe.naturalHeight<700)throw new Error(`Hero-Auflösung ${probe.naturalWidth}x${probe.naturalHeight} ist zu klein.`);
    target.src=objectUrl;
    document.documentElement.style.setProperty('--hero-image',`url("${objectUrl}")`);
    document.body.dataset.heroReady='true';
  }catch(error){
    document.body.dataset.heroReady='fallback';
    console.error('Freigegebener Hero konnte nicht geladen werden.',error);
  }
}
loadApprovedHero();

const menuButton=document.querySelector('.menu-button');
const nav=document.querySelector('.main-nav');
menuButton?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));menuButton.textContent=open?'×':'☰'});
nav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{nav.classList.remove('open');menuButton?.setAttribute('aria-expanded','false');if(menuButton)menuButton.textContent='☰'}));

document.querySelectorAll('[data-dialog]').forEach(button=>button.addEventListener('click',()=>document.getElementById(button.dataset.dialog)?.showModal()));
document.querySelectorAll('.dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()}));

function bindToggle(buttonId,gridId,openLabel,closedLabel){const button=document.getElementById(buttonId);const grid=document.getElementById(gridId);button?.addEventListener('click',()=>{const expanded=grid.classList.toggle('show-all');button.setAttribute('aria-expanded',String(expanded));button.textContent=expanded?closedLabel:openLabel});}
bindToggle('toggle-stories','story-grid','Alle 16 Erfolgsgeschichten anzeigen','Weniger Erfolgsgeschichten anzeigen');
bindToggle('toggle-searches','search-grid','Alle 11 Suchaufträge anzeigen','Weniger Suchaufträge anzeigen');

function openPreparedMail(form){const subject=form.dataset.mailSubject||'Kontaktanfrage über die Maloba-Webseite';const body=[...new FormData(form).entries()].filter(([,value])=>String(value).trim()).map(([key,value])=>`${key}: ${value}`).join('\n');window.location.href=`mailto:info@maloba-immobilien.de?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;}

document.querySelectorAll('form[data-mail-subject]').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;openPreparedMail(form);form.closest('dialog')?.close()}));

document.querySelectorAll('img').forEach(image=>image.addEventListener('error',()=>{image.classList.add('image-failed');image.alt=`${image.alt} – Bild derzeit nicht verfügbar`;}));

const sections=[...document.querySelectorAll('main section[id],header[id]')];
const links=[...document.querySelectorAll('.main-nav a[href^="#"]')];
const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting)links.forEach(link=>link.classList.toggle('active',link.getAttribute('href')===`#${entry.target.id}`))})},{rootMargin:'-35% 0px -55%'});
sections.forEach(section=>observer.observe(section));
