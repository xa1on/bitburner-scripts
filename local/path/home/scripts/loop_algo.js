/** @param {NS} ns */
export async function main(ns) {
    await ns.sleep(2000);
    const hostname = ns.getHostname();
    const free_ram = ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname);
    const script_dir = "scripts/";
    const scripts = [script_dir + "hack_only.js", script_dir + "weaken_only.js", script_dir + "grow_only.js"];
    const ratio = [0.01, 0.34, 0.65];
    const fill = 1; // index of filler script
    const hack_index = 0;
    const ram_usage = ns.getScriptRam(scripts[1]);
    const threads = Math.floor(free_ram / ram_usage);
    var used_threads = 0;
    var current_thread_count = null;
    for (var i = 0; i < scripts.length; i++) {
        if (i === hack_index) {
            continue
        }
        current_thread_count = Math.floor(ratio[i] * threads);
        if (current_thread_count > 0) {
            used_threads += current_thread_count;
            ns.exec(scripts[i], hostname, current_thread_count, ns.args[0]);
        }
        await ns.sleep(20000);
    }

    while (ns.getServerMoneyAvailable(ns.args[0]) < (ns.args[1] * 0.95) || ns.getServerSecurityLevel(ns.args[0]) > (ns.args[2] * 1.05)) {
        await ns.sleep(200);
    }
    current_thread_count = Math.floor(ratio[hack_index] * threads);
    if (current_thread_count > 0) {
        used_threads += current_thread_count;
        ns.exec(scripts[hack_index], hostname, current_thread_count, ns.args[0]);
    }

    if (used_threads < threads) {
        ns.exec(scripts[fill], hostname, threads - used_threads, ns.args[0]);
    }
}