export const LOG_STYLES = `
        :root{
          --sleep:#7B6CF6;--sleep-bg:#F0EEFF;
          --formula:#F5A623;--formula-bg:#FFF8EC;
          --breast:#E8667A;--breast-bg:#FFF0F2;
          --diaper:#3DBAA2;--diaper-bg:#EDFAF7;
          --growth:#34C759;--growth-bg:#E8F8ED;
          --hospital:#FF6B6B;--hospital-bg:#FFF0F0;
          --bath:#29A8E0;--bath-bg:#E8F6FD;
          --primary:#5B7BFF;--primary-bg:#EEF1FF;
          --bg:#F4F5FA;--card:#fff;
          --txt:#1A1D2E;--txt2:#6B7280;--txt3:#B0B7C3;
          --border:#E8EAF0;--r:16px;--rs:10px;
        }
        body.dark{
          --bg:#0F1117;--card:#1C1F2E;--txt:#F0F2FF;--txt2:#9BA3B8;--txt3:#4A5268;
          --border:#2A2D3E;--primary-bg:#1A1F3A;
          --sleep-bg:#1E1A3A;--formula-bg:#2A1F0A;--breast-bg:#2A141A;--diaper-bg:#0A2220;
          --growth-bg:#0A2010;--hospital-bg:#2A0A0A;--bath-bg:#0A1E2A;
        }
        *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
        button{touch-action:manipulation;user-select:none;-webkit-user-select:none}
        body{font-family:'Noto Sans KR',sans-serif;background:var(--bg);color:var(--txt);max-width:430px;margin:0 auto;min-height:100vh}
        .hd{background:linear-gradient(135deg,#4A6CF7 0%,#7B3FF2 100%);padding:16px 16px 0;color:#fff;position:relative;overflow:hidden}
        .hd::before{content:'';position:absolute;top:-50px;right:-20px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.06);pointer-events:none}
        .hd::after{content:'';position:absolute;bottom:-40px;left:10px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.04);pointer-events:none}
        .hd-top{display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:14px;position:relative;z-index:1}
        .hd-title{font-size:22px;font-weight:900;letter-spacing:-.6px;text-shadow:0 1px 6px rgba(0,0,0,.15)}
        .hd-sub{font-size:12px;opacity:.8;margin-top:2px;font-weight:500}
        .hd-actions{display:flex;gap:8px}
        .hd-btn{background:rgba(255,255,255,.18);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.22);border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;font-size:16px}
        .hd-btn:active{background:rgba(255,255,255,.3)}
        .sync-bar{position:relative;z-index:1;border-top:1px solid rgba(255,255,255,.12);margin:0 -16px;padding:6px 16px 8px}
        .sync-row{display:flex;align-items:center;gap:7px;font-size:11.5px;color:rgba(255,255,255,.9);font-weight:500;margin-bottom:3px}
        .sync-dot{width:7px;height:7px;border-radius:50%;background:#4ADE80;flex-shrink:0;box-shadow:0 0 6px rgba(74,222,128,.8)}
        .sync-dot.off{background:#FCA5A5;box-shadow:0 0 6px rgba(252,165,165,.8)}
        .sync-dot.loading{background:#FCD34D;box-shadow:0 0 6px rgba(252,211,77,.8);animation:blink .8s infinite}
        .sync-secure{font-size:10.5px;color:rgba(255,255,255,.55);transition:opacity .35s}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        body.dark .hd{background:linear-gradient(135deg,#1A2060 0%,#2D1060 100%)}
        .tab-bar{display:flex;background:var(--card);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:50;overflow-x:auto;scrollbar-width:none;box-shadow:0 1px 6px rgba(0,0,0,.05)}
        .tab-bar::-webkit-scrollbar{display:none}
        .tab-btn{flex-shrink:0;padding:13px 16px;font-size:12px;font-weight:600;color:var(--txt2);background:none;border:none;border-bottom:2.5px solid transparent;cursor:pointer;font-family:inherit;white-space:nowrap;letter-spacing:.1px}
        .tab-btn.active{color:var(--primary);border-bottom-color:var(--primary)}
        .quick-row{display:flex;gap:5px;overflow-x:auto;padding:14px 16px 12px;background:var(--card);border-bottom:1px solid var(--border);scrollbar-width:none}
        .quick-row::-webkit-scrollbar{display:none}
        .qb{flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;min-width:50px}
        .qb-icon{width:52px;height:52px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:24px;transition:transform .12s;box-shadow:0 2px 8px rgba(0,0,0,.07)}
        .qb:active .qb-icon{transform:scale(.88)}
        .qb-icon.sleep{background:var(--sleep-bg)}.qb-icon.formula{background:var(--formula-bg)}
        .qb-icon.breast{background:var(--breast-bg)}.qb-icon.diaper{background:var(--diaper-bg)}
        .qb-icon.growth{background:var(--growth-bg)}.qb-icon.hospital{background:var(--hospital-bg)}
        .qb-icon.bath{background:var(--bath-bg)}
        .qb-name{font-size:10.5px;color:var(--txt2);font-weight:600}
        .warn-banner{margin:10px 16px 0;border-radius:12px;padding:11px 15px;font-size:13px;font-weight:500;display:flex;align-items:center;gap:8px}
        .warn-banner.feed{background:linear-gradient(135deg,#FFF3E0,#FFE8C0);color:#BF4400;border:1px solid #FFCC80}
        .last-bar{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:12px 16px;background:var(--card);border-bottom:1px solid var(--border)}
        .lc{background:linear-gradient(135deg,#F8F9FF,#EEF1FF);border-radius:14px;padding:10px 11px;border:1px solid rgba(91,123,255,.1)}
        .lc-label{font-size:9.5px;color:var(--primary);font-weight:700;margin-bottom:4px;letter-spacing:.3px;text-transform:uppercase}
        .lc-time{font-size:13px;font-weight:800;line-height:1.2;letter-spacing:-.2px}
        .lc-detail{font-size:10px;color:var(--txt2);margin-top:3px}
        body.dark .lc{background:linear-gradient(135deg,#1A1F38,#141830);border-color:rgba(91,123,255,.15)}
        .date-nav{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--card);border-bottom:1px solid var(--border)}
        .dnbtn{background:none;border:none;font-size:22px;color:var(--txt2);cursor:pointer;padding:2px 10px}
        .date-main{font-size:15px;font-weight:700;text-align:center}
        .date-age{font-size:11px;color:var(--txt2);margin-top:1px;text-align:center}
        .chips{display:flex;gap:7px;overflow-x:auto;padding:11px 16px;background:var(--card);border-bottom:1px solid var(--border);scrollbar-width:none}
        .chips::-webkit-scrollbar{display:none}
        .chip{flex-shrink:0;display:flex;align-items:center;gap:5px;padding:6px 13px;border-radius:22px;font-size:12px;font-weight:700;position:relative;overflow:hidden}
        .chip.sleep{background:var(--sleep-bg);color:var(--sleep)}.chip.formula{background:var(--formula-bg);color:#B87E0E}
        .chip.breast{background:var(--breast-bg);color:var(--breast)}.chip.diaper{background:var(--diaper-bg);color:var(--diaper)}
        .chip.goal{background:linear-gradient(135deg,#E8F5E9,#D4EDDA);color:#1B5E20;border:1px solid rgba(52,199,89,.15)}
        .goal-bar{position:absolute;bottom:0;left:0;height:3px;border-radius:0 0 22px 22px;background:linear-gradient(90deg,#4CAF50,#81C784)}
        .log-list{padding:12px 16px 140px}
        .log-card{background:var(--card);border-radius:18px;padding:14px 15px;margin-bottom:10px;display:flex;gap:12px;align-items:flex-start;box-shadow:0 1px 8px rgba(0,0,0,.06);border:1px solid transparent;transition:border-color .15s,background .15s}
        .li-icon{width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
        .li-icon.sleep{background:var(--sleep-bg)}.li-icon.formula{background:var(--formula-bg)}
        .li-icon.breast{background:var(--breast-bg)}.li-icon.diaper{background:var(--diaper-bg)}
        .li-icon.growth{background:var(--growth-bg)}.li-icon.hospital{background:var(--hospital-bg)}
        .li-icon.bath{background:var(--bath-bg)}.li-body{flex:1;min-width:0}
        .li-type{font-size:14px;font-weight:700}
        .li-type.sleep{color:var(--sleep)}.li-type.formula{color:var(--formula)}
        .li-type.breast{color:var(--breast)}.li-type.diaper{color:var(--diaper)}
        .li-type.growth{color:var(--growth)}.li-type.hospital{color:var(--hospital)}
        .li-type.bath{color:var(--bath)}.li-detail{font-size:13px;color:var(--txt2);margin-top:3px}
        .li-right{display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0}
        .li-time{font-size:14px;font-weight:600}
        .li-end{font-size:11px;color:var(--txt3)}
        .del-btn{background:none;border:none;color:var(--txt3);cursor:pointer;font-size:18px;padding:0 0 0 6px;line-height:1}
        .sleep-timer{font-size:11px;color:var(--sleep);font-weight:700;margin-top:2px}
        .memo-text{font-size:11px;color:var(--txt3);margin-top:3px;font-style:italic}
        .empty{text-align:center;padding:60px 20px;color:var(--txt3)}
        .empty-e{font-size:44px;margin-bottom:12px}
        .loading-overlay{position:fixed;inset:0;background:rgba(255,255,255,.85);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;z-index:500;font-size:14px;color:var(--txt2)}
        .loading-overlay.hidden{display:none}
        .spinner{width:36px;height:36px;border:3px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:spin .7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .fab-bar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;background:var(--card);border-top:1px solid var(--border);padding:12px 16px 36px;display:flex;gap:8px;z-index:100}
        .fab-mic{flex:1;display:flex;align-items:center;justify-content:center;gap:10px;padding:18px 14px;background:linear-gradient(135deg,#4A6CF7,#7B3FF2);color:#fff;border:none;border-radius:18px;font-size:17px;font-weight:800;cursor:pointer;font-family:inherit;box-shadow:0 4px 20px rgba(91,123,255,.35);letter-spacing:-.2px}
        .fab-mic.on{background:linear-gradient(135deg,#E8667A,#C0394D);animation:pulse 1s infinite;box-shadow:0 4px 20px rgba(232,102,122,.4)}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.75}}
        .voice-overlay{position:fixed;inset:0;background:rgba(10,10,30,.88);z-index:300;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}
        .voice-ring{width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-size:44px;animation:ring 1.2s ease-in-out infinite}
        @keyframes ring{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(255,255,255,.3)}50%{transform:scale(1.08);box-shadow:0 0 0 20px rgba(255,255,255,0)}}
        .voice-tip{color:rgba(255,255,255,.9);font-size:14px;font-weight:500}
        .voice-hint{color:rgba(255,255,255,.5);font-size:12px;text-align:center;line-height:1.8}
        .voice-cancel{padding:10px 28px;background:rgba(255,255,255,.15);border:none;border-radius:20px;color:#fff;font-size:14px;cursor:pointer;font-family:inherit}
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:flex-end}
        .sheet{background:var(--card);border-radius:24px 24px 0 0;padding:8px 16px 40px;width:100%;max-height:92vh;overflow-y:auto}
        .drag-bar{width:36px;height:4px;background:var(--border);border-radius:2px;margin:8px auto 14px}
        .sheet-title{font-size:17px;font-weight:700;margin-bottom:14px;text-align:center}
        .type-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:18px}
        .type-tile{border:2px solid var(--border);border-radius:var(--rs);padding:11px 4px;text-align:center;cursor:pointer;background:var(--card);font-family:inherit}
        .type-tile .em{font-size:22px;display:block;margin-bottom:4px}
        .type-tile .nm{font-size:11px;color:var(--txt2);font-weight:500}
        .fg{margin-bottom:12px}
        .fg label{display:block;font-size:12px;color:var(--txt2);margin-bottom:5px;font-weight:500}
        .fg input,.fg select,.fg textarea{width:100%;padding:0 12px;border:1.5px solid var(--border);border-radius:var(--rs);font-size:15px;font-family:inherit;color:var(--txt);background:var(--card);outline:none;height:48px;-webkit-appearance:none}
        .fg textarea{height:72px;padding:12px;resize:none}
        .fg input:focus,.fg select:focus,.fg textarea:focus{border-color:var(--primary)}
        .row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .seg{display:flex;border-radius:var(--rs);overflow:hidden;border:1.5px solid var(--border)}
        .seg button{flex:1;padding:10px 4px;background:var(--card);border:none;font-size:13px;font-family:inherit;color:var(--txt2);cursor:pointer;font-weight:500}
        .seg button.sel{background:var(--primary);color:#fff}
        .breast-box{background:var(--breast-bg);border-radius:var(--rs);padding:12px;margin-bottom:12px}
        .bt-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .bt-side{background:var(--card);border-radius:8px;padding:10px;text-align:center}
        .bt-side-name{font-size:11px;color:var(--txt2);margin-bottom:6px;font-weight:500}
        .bt-side-val{font-size:22px;font-weight:700;color:var(--breast)}
        .bt-btns{display:flex;gap:4px;justify-content:center;margin-top:6px}
        .bt-btns button{width:36px;height:36px;border-radius:50%;border:none;background:var(--breast-bg);color:var(--breast);font-size:20px;cursor:pointer;font-family:inherit;font-weight:700;display:flex;align-items:center;justify-content:center}
        .save-btn{width:100%;padding:15px;background:var(--primary);color:#fff;border:none;border-radius:var(--r);font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:4px}
        .cancel-btn{width:100%;padding:10px;background:none;border:none;color:var(--txt2);font-size:14px;cursor:pointer;font-family:inherit;margin-top:4px}
        .cal-sheet{background:var(--card);border-radius:24px 24px 0 0;padding:8px 16px 32px;width:100%;max-height:80vh;overflow-y:auto}
        .cal-head{display:flex;align-items:center;justify-content:space-between;padding:10px 0}
        .cal-head span{font-size:16px;font-weight:700}
        .cal-head button{background:none;border:none;font-size:22px;color:var(--txt2);cursor:pointer;padding:4px 10px}
        .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);text-align:center;gap:2px}
        .cal-dn{font-size:11px;color:var(--txt3);padding:4px 0}
        .cal-d{font-size:14px;cursor:pointer;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;margin:0 auto;position:relative}
        .cal-d:hover{background:var(--bg)}.cal-d.today{background:var(--primary);color:#fff}
        .cal-d.sel{background:var(--primary-bg);color:var(--primary);font-weight:700}
        .cal-d.has::after{content:'';position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:var(--diaper)}
        .cal-d.empty{cursor:default}
        .toast{position:fixed;bottom:120px;left:50%;transform:translateX(-50%);background:rgba(26,29,46,.9);color:#fff;padding:10px 20px;border-radius:20px;font-size:13px;z-index:400;opacity:0;transition:opacity .3s;pointer-events:none;white-space:nowrap}
        .toast.show{opacity:1}
        .page{display:none;padding-bottom:140px}.page.show{display:block}
        .ai-card{margin:12px 16px;background:linear-gradient(135deg,#5B7BFF,#7B6CF6);border-radius:var(--r);padding:16px;color:#fff}
        .ai-badge{background:rgba(255,255,255,.25);border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700}
        .ai-text{font-size:14px;line-height:1.7;margin-top:10px}
        .stat-section{margin:0 16px 16px;background:var(--card);border-radius:var(--r);overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06)}
        .stat-section-hd{display:flex;align-items:center;gap:8px;padding:14px 16px 10px;border-bottom:1px solid var(--border)}
        .stat-section-hd span{font-size:15px;font-weight:700}
        .stat-row{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:.5px solid var(--border)}
        .stat-row:last-child{border-bottom:none}
        .stat-lbl{font-size:13px;color:var(--txt2)}.stat-val{font-size:14px;font-weight:600}
        .stat-bar-wrap{padding:8px 16px 14px}
        .stat-bar-bg{background:var(--bg);border-radius:20px;height:8px;overflow:hidden;margin-top:4px}
        .stat-bar-fill{height:100%;border-radius:20px;transition:width .6s ease}
        .week-chart{padding:12px 16px 16px}
        .wc-row{display:flex;align-items:flex-end;gap:6px;height:80px;margin-bottom:6px}
        .wc-bar-wrap{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px}
        .wc-label{font-size:10px;color:var(--txt3);text-align:center}
        .wc-today .wc-label{color:var(--primary);font-weight:700}
        .period-nav{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:var(--card);border-bottom:1px solid var(--border)}
        .period-nav span{font-size:14px;font-weight:600}
        .period-btn{background:none;border:none;font-size:20px;color:var(--txt2);cursor:pointer;padding:4px 10px}
        .period-tabs{display:flex;gap:4px;background:var(--bg);border-radius:20px;padding:3px}
        .period-tab{padding:5px 14px;border-radius:20px;font-size:12px;font-weight:500;border:none;background:none;cursor:pointer;color:var(--txt2);font-family:inherit}
        .period-tab.sel{background:var(--card);color:var(--primary);font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,.1)}
        .settings-row{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:.5px solid var(--border)}
        .settings-row:last-child{border-bottom:none}
        .settings-lbl{font-size:14px;font-weight:500}
        .settings-sub{font-size:12px;color:var(--txt2);margin-top:2px}
        .toggle{width:48px;height:28px;border-radius:14px;background:var(--border);position:relative;cursor:pointer;border:none;flex-shrink:0}
        .toggle.on{background:var(--primary)}
        .toggle::after{content:'';position:absolute;width:22px;height:22px;border-radius:50%;background:#fff;top:3px;left:3px;transition:transform .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)}
        .toggle.on::after{transform:translateX(20px)}
        .s-input{width:120px;text-align:right;border:none;font-size:14px;font-weight:600;color:var(--primary);background:transparent;outline:none;font-family:inherit}
        .s-input-sm{width:60px;text-align:right;border:none;font-size:14px;font-weight:600;color:var(--primary);background:transparent;outline:none;font-family:inherit}
        .time-adj{background:var(--bg);border-radius:var(--rs);padding:12px;margin-bottom:12px}
        .time-adj-val{font-size:28px;font-weight:900;text-align:center;color:var(--primary);padding:8px 0;letter-spacing:1px}
        .time-adj-btns{display:grid;grid-template-columns:repeat(6,1fr);gap:5px}
        .time-adj-btns button{padding:8px 2px;background:var(--card);border:1.5px solid var(--border);border-radius:8px;font-size:12px;font-weight:600;color:var(--txt);cursor:pointer;font-family:inherit}
        .time-adj-btns button:active{background:var(--primary-bg);border-color:var(--primary);color:var(--primary)}
        body.dark .hd{background:linear-gradient(135deg,#1A2060 0%,#2D1060 100%)}
        body.dark .tab-bar,body.dark .quick-row,body.dark .last-bar,body.dark .date-nav,body.dark .chips,body.dark .fab-bar,body.dark .period-nav{background:var(--card)}
        body.dark .stat-section,body.dark .log-card,body.dark .sheet,body.dark .cal-sheet{background:var(--card)}
        body.dark .fg input,body.dark .fg select,body.dark .fg textarea,body.dark .type-tile,body.dark .seg button,body.dark .bt-side{background:var(--card);color:var(--txt)}
        body.dark .loading-overlay{background:rgba(15,17,23,.9)}
      `;
