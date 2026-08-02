const mobileFix=document.createElement('style');
mobileFix.textContent='@media(max-width:900px){.mobile-hero-photo{background-position:right center}}@media(max-width:620px){.mobile-hero-photo{height:380px;background-position:right center}.mobile-hero-copy{padding-bottom:40px}.mobile-bar{transform:translateY(100%);transition:transform .22s ease}.mobile-bar.visible{transform:translateY(0)}}';
document.head.appendChild(mobileFix);

const heroAsset='assets/hero-master.webp';
const heroTarget=document.getElementById('hero-master');
const desktopHero=document.querySelector('.desktop-hero');
if(desktopHero&&!desktopHero.querySelector('h1')){
  const headline=document.createElement('h1');
  headline.textContent='Immobilien verdienen mehr als ein Inserat.';
  headline.style.cssText='position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';
  desktopHero.prepend(headline);
}
if(heroTarget){
  heroTarget.src=heroAsset;
  document.documentElement.style.setProperty('--hero-image',`url("${heroAsset}")`);
  heroTarget.addEventListener('load',()=>{document.body.dataset.heroReady=heroTarget.naturalWidth>=1400&&heroTarget.naturalHeight>=700?'true':'invalid';},{once:true});
  heroTarget.addEventListener('error',()=>{document.body.dataset.heroReady='error';console.error('Der freigegebene Hero konnte nicht geladen werden.');},{once:true});
}

const menuButton=document.querySelector('.menu-button');
const nav=document.querySelector('.main-nav');
menuButton?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));menuButton.textContent=open?'×':'☰'});
nav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{nav.classList.remove('open');menuButton?.setAttribute('aria-expanded','false');if(menuButton)menuButton.textContent='☰'}));

document.querySelectorAll('[data-dialog]').forEach(button=>button.addEventListener('click',()=>document.getElementById(button.dataset.dialog)?.showModal()));
document.querySelectorAll('.dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()}));
document.querySelectorAll('.dialog-close').forEach(button=>{button.type='button';button.addEventListener('click',()=>button.closest('dialog')?.close())});

const mobileBar=document.querySelector('.mobile-bar');
const updateMobileBar=()=>mobileBar?.classList.toggle('visible',window.scrollY>560);
window.addEventListener('scroll',updateMobileBar,{passive:true});
updateMobileBar();

function bindToggle(buttonId,gridId,openLabel,closedLabel){const button=document.getElementById(buttonId);const grid=document.getElementById(gridId);button?.addEventListener('click',()=>{const expanded=grid.classList.toggle('show-all');button.setAttribute('aria-expanded',String(expanded));button.textContent=expanded?closedLabel:openLabel});}
bindToggle('toggle-stories','story-grid','Alle 16 Erfolgsgeschichten anzeigen','Weniger Erfolgsgeschichten anzeigen');
bindToggle('toggle-searches','search-grid','Alle 11 Suchaufträge anzeigen','Weniger Suchaufträge anzeigen');

function openPreparedMail(form){const subject=form.dataset.mailSubject||'Kontaktanfrage über die Maloba-Webseite';const body=[...new FormData(form).entries()].filter(([,value])=>String(value).trim()).map(([key,value])=>`${key}: ${value}`).join('\n');window.location.href=`mailto:info@maloba-immobilien.de?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;}

document.querySelectorAll('form[data-mail-subject]').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();if(event.submitter?.classList.contains('dialog-close'))return;if(!form.reportValidity())return;openPreparedMail(form);form.closest('dialog')?.close()}));

document.querySelectorAll('img').forEach(image=>image.addEventListener('error',()=>{image.classList.add('image-failed');image.alt=`${image.alt} – Bild derzeit nicht verfügbar`;}));

const sections=[...document.querySelectorAll('main section[id],header[id]')];
const links=[...document.querySelectorAll('.main-nav a[href^="#"]')];
const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting)links.forEach(link=>link.classList.toggle('active',link.getAttribute('href')===`#${entry.target.id}`))})},{rootMargin:'-35% 0px -55%'});
sections.forEach(section=>observer.observe(section));
