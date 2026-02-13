const global_timezones = Intl.supportedValuesOf('timeZone');
let alarm_storage = [];
let lap_storage = [];
let audio_controller = new Audio();
let default_tone = "https://actions.google.com/sounds/v1/alarms/beep_short.ogg";


function run_master_clock()
{
    const now = new Date();
    const current_hh_mm = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');

    document.getElementById("main_clock").textContent = now.toLocaleTimeString('en-GB', { hour12: false });
    document.getElementById("full_date").textContent = now.toDateString().toUpperCase();
    document.getElementById("current_zone_id").textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;

    alarm_storage.forEach((alarm, index) => {
        if (alarm.time === current_hh_mm)
        {
            fire_alert("ALARM ACTIVE", `Time: ${alarm.time}`, alarm.sound);
            alarm_storage.splice(index, 1);
            render_alarms();
        }
    });
}
setInterval(run_master_clock, 1000);
run_master_clock();

document.querySelectorAll(".nav_btn_green").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".nav_btn_green").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab_pane").forEach(p => p.classList.add("hidden"));
        btn.classList.add("active");
        document.getElementById(btn.dataset.target).classList.remove("hidden");
    };
});

document.getElementById("add_alarm_btn").onclick = () => {
    let t = document.getElementById("alarm_time_input").value;
    let f = document.getElementById("alarm_sound_input").files[0];
    
    if (!t)
        return;

    let new_alarm = {
        time: t, 
        sound: default_tone 
    };
    
    if (f)
    {
        let r = new FileReader();
        r.onload = e => { new_alarm.sound = e.target.result; alarm_storage.push(new_alarm); render_alarms(); };
        r.readAsDataURL(f);
    }
    else
    {
        alarm_storage.push(new_alarm);
        render_alarms();
    }
};

function render_alarms()
{
    document.getElementById("alarm_container").innerHTML = alarm_storage.map((a, i) =>
        `<div class="item_row_green"><span>${a.time}</span><button class="del_icon" onclick="alarm_storage.splice(${i},1);render_alarms();">🗑️</button></div>`
    ).join('');
}

let sw_ref, sw_ms = 0, sw_start;

document.getElementById("sw_start_trigger").onclick = () => {
    
    if (sw_ref)
        return;
    
    sw_start = Date.now() - sw_ms;
    sw_ref = setInterval(() => {
        sw_ms = Date.now() - sw_start;
        let s = Math.floor(sw_ms / 1000);
        let m = Math.floor(s / 60).toString().padStart(2, '0');
        let sec = (s % 60).toString().padStart(2, '0');
        let ms = Math.floor((sw_ms % 1000) / 10).toString().padStart(2, '0');
        document.getElementById("stopwatch_timer_display").textContent = `${m}:${sec}:${ms}`;
    }, 10);
};

document.getElementById("sw_lap_trigger").onclick = () => {
    
    if (sw_ms === 0)
        return;
    
    let lap = document.getElementById("stopwatch_timer_display").textContent;
    lap_storage.unshift(lap);
    document.getElementById("lap_container").innerHTML = lap_storage.map((l, i) => 
        `<div class="item_row_green small"><span>LAP ${lap_storage.length - i}</span><span class="text-white">${l}</span></div>`
    ).join('');
};

document.getElementById("sw_stop_trigger").onclick = () => {
    clearInterval(sw_ref); sw_ref = null;
};

document.getElementById("sw_reset_trigger").onclick = () => {
    clearInterval(sw_ref); sw_ref = null; sw_ms = 0; lap_storage = [];
    document.getElementById("stopwatch_timer_display").textContent = "00:00:00";
    document.getElementById("lap_container").innerHTML = "";
};

let timer_ref;
document.getElementById("timer_start_trigger").onclick = () => {
    let total = (parseInt(document.getElementById("timer_min_val").value) || 0) * 60 + (parseInt(document.getElementById("timer_sec_val").value) || 0);
    if (total <= 0) return;
    clearInterval(timer_ref);
    timer_ref = setInterval(() => {
        total--;
        document.getElementById("countdown_timer_display").textContent = 
            `${Math.floor(total / 60).toString().padStart(2,'0')}:${(total % 60).toString().padStart(2,'0')}`;
        if (total <= 0) {
            clearInterval(timer_ref);
            fire_alert("TIMER", "Finished!", default_tone);
        }
    }, 1000);
};

document.getElementById("world_search_input").oninput = function() {
    let q = this.value.toLowerCase();
    let g = document.getElementById("world_grid_display");
    let list = q.length < 2 ? ["Asia/Kolkata", "Europe/London", "America/New_York"] : global_timezones.filter(z => z.toLowerCase().includes(q)).slice(0, 10);
    
    g.innerHTML = list.map(z => { 
        let t = new Date().toLocaleTimeString('en-GB', { timeZone: z, hour12: false, hour: '2-digit', minute: '2-digit' }); 
        return `<div class="col-6 mb-2"><div class="item_row_green flex-column align-items-start"><small style="color:#10b981">${z.split('/').pop()}</small><b>${t}</b></div></div>`; 
    }).join('');
};

function fire_alert(t, d, s)
{
    audio_controller.src = s; audio_controller.loop = true; audio_controller.play();
    document.getElementById("alert_title").textContent = t;
    document.getElementById("alert_description").textContent = d;
    document.getElementById("global_alert_overlay").classList.remove("hidden");
}

document.getElementById("close_alert_btn").onclick = () => {
    audio_controller.pause();
    document.getElementById("global_alert_overlay").classList.add("hidden");
};
