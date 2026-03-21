/**
 * ═══════════════════════════════════════════════════════
 *  Antifraud Assistant — Embed Integration Guide
 * ═══════════════════════════════════════════════════════
 *
 * This widget can be embedded in any web application
 * (React, Vue, Angular, vanilla HTML) via an iframe.
 *
 * ── 1. Simple iframe embed ──────────────────────────────
 *
 *   <iframe
 *     src="https://YOUR_DOMAIN/embed"
 *     style="width: 420px; height: 600px; border: none; border-radius: 16px; overflow: hidden;"
 *     allow="clipboard-write"
 *   ></iframe>
 *
 *
 * ── 2. Floating button + popup (vanilla JS) ────────────
 *
 *   <script>
 *     (function() {
 *       const WIDGET_URL = 'https://YOUR_DOMAIN/embed';
 *
 *       // Create toggle button
 *       const btn = document.createElement('button');
 *       btn.innerHTML = '✦';
 *       Object.assign(btn.style, {
 *         position: 'fixed', bottom: '24px', right: '24px', zIndex: '9999',
 *         width: '56px', height: '56px', borderRadius: '50%', border: 'none',
 *         background: 'linear-gradient(135deg, #22c55e, #14b8a6)',
 *         color: '#fff', fontSize: '22px', cursor: 'pointer',
 *         boxShadow: '0 4px 20px rgba(34,197,94,0.4)',
 *       });
 *       document.body.appendChild(btn);
 *
 *       // Create iframe container
 *       const container = document.createElement('div');
 *       Object.assign(container.style, {
 *         position: 'fixed', bottom: '96px', right: '24px', zIndex: '9998',
 *         width: '420px', height: '620px', borderRadius: '16px',
 *         overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
 *         display: 'none', transition: 'opacity 0.2s',
 *       });
 *       const iframe = document.createElement('iframe');
 *       iframe.src = WIDGET_URL;
 *       Object.assign(iframe.style, { width: '100%', height: '100%', border: 'none' });
 *       iframe.allow = 'clipboard-write';
 *       container.appendChild(iframe);
 *       document.body.appendChild(container);
 *
 *       let open = false;
 *       btn.addEventListener('click', () => {
 *         open = !open;
 *         container.style.display = open ? 'block' : 'none';
 *         btn.innerHTML = open ? '✕' : '✦';
 *       });
 *     })();
 *   </script>
 *
 *
 * ── 3. React component wrapper ──────────────────────────
 *
 *   function AntifraudWidget({ width = 420, height = 620 }) {
 *     const [open, setOpen] = React.useState(false);
 *     return (
 *       <>
 *         <button onClick={() => setOpen(!open)}
 *           style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
 *             width: 56, height: 56, borderRadius: '50%',
 *             background: 'linear-gradient(135deg, #22c55e, #14b8a6)',
 *             border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer' }}>
 *           {open ? '✕' : '✦'}
 *         </button>
 *         {open && (
 *           <iframe src="https://YOUR_DOMAIN/embed"
 *             style={{ position: 'fixed', bottom: 96, right: 24, zIndex: 9998,
 *               width, height, border: 'none', borderRadius: 16,
 *               boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}
 *             allow="clipboard-write" />
 *         )}
 *       </>
 *     );
 *   }
 *
 *
 * ── 4. Vue component wrapper ────────────────────────────
 *
 *   <template>
 *     <button @click="open = !open" class="widget-btn">
 *       {{ open ? '✕' : '✦' }}
 *     </button>
 *     <iframe v-if="open" src="https://YOUR_DOMAIN/embed"
 *       class="widget-iframe" allow="clipboard-write" />
 *   </template>
 *   <script setup>
 *     import { ref } from 'vue';
 *     const open = ref(false);
 *   </script>
 *
 *
 * ── 5. URL Parameters ───────────────────────────────────
 *
 *   /embed?theme=dark    — force dark theme
 *   /embed?theme=light   — force light theme
 *
 * ═══════════════════════════════════════════════════════
 */

export {};
