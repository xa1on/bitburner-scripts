/** @param {NS} ns */
export async function main(ns) {

    const hostfile = "home";
    const script_dir = "scripts"; // script folder
    const script_type_dir = "batch"; // script type folder
    const this_file = script_dir + "batch.js";
    var batch_scripts = ["hack_only.js", "weaken_only.js", "grow_only.js"]; // scrips used for batch run
    var script_desc = ["hack", "weaken", "grow"];
    // include script_dir & script_type to get correct directory
    for (var i = 0; i < batch_scripts; i++) { batch_scripts[i] = script_dir + "/" + script_type_dir + "/" + batch_scripts[i]; }
    var ram_usage = [1.70, 1.75, 1.75];
    var batch_order = [0, 1, 2, 1]; // order that batch_scripts should run with index
    var ratio = [0.01, 0.33, 0.33, 0.33]; // ratio corresponding to script of same index in batch_order
    const batch_delay = 100; // delay between items in batch

    var growth_phase_order = [1, 2];
    var growth_phase_ratio = [0.5, 0.5];

    // returns a valid list for "for_each"
    function normalizeForEach(for_each) {
        if (for_each === undefined) {
            for_each = [];
        } else if (!Array.isArray(for_each)) {
            for_each = [for_each];
        }
        return for_each;
    }

    // returns a list of all servers
    function getAllServers(for_each) {
        var servers_seen = [hostfile];
        var scanned = null;
        for_each = normalizeForEach(for_each);
        for (var i = 0; i < servers_seen.length; i++) {
            scanned = ns.scan(servers_seen[i]);
            for (var j = 0; j < scanned.length; j++) {
                if (servers_seen.indexOf(scanned[j]) === -1) {
                    servers_seen.push(scanned[j]);
                    for (var k = 0; k < for_each; k++) {
                        for_each[k](scanned[j]);
                    }
                }
            }
        }
        return servers_seen;
    }

    // returns a dictionary containing the total amount of threads and threads per server based on index
    function getThreadDist(ram_use, for_each) {
        for_each = normalizeForEach(for_each);
        var threads = [];
        var total = 0;
        var available_threads;
        for_each.push(function (server) {
            available_threads = Math.floor(ns.getServerMaxRam(server) - ns.getServerUsedRam(server) / ram_use);
            ram.push(available_threads);
            total += available_threads;
        });
        var servers = getAllServers(for_each);
        return {total: total, thread_count: threads, servers: servers};
    }

    // uses ratio to 
    function allocateThreads(target, batch_scripts, script_desc, ram_usage, batch_order, ratio, batch_delay, for_each) {
        for_each = normalizeForEach(for_each);
        for_each = [function (server) {
            if (server !== hostfile) {
                ns.killall(server);
                for (var i = 0; i < batch_scripts; i++) {
                    ns.scp(batch_scripts[i], server);
                }
            } else {
                var scripts_running = ns.ps(server);
                for (var i = 0; i < scripts_running.length; i++) {
                    if (scripts_running[i]["filename"] !== this_file) {
                        ns.kill(scripts_running[i]["pid"]);
                    }
                }
            }
        }].concat(for_each);
        var max_ram_usage = Math.max(...ram_usage)
        var thread_dist = getThreadDist(max_ram_usage, for_each);
        var timings = [];

        var allocation_left;
        var server_index = 0;
        var current_script;
        var base_length = 0;
        var base_length_index;
        var current_timing;
        var post_delay;
        var additional_m_sec;

        for (var i = 0; i < batch_order; i++) {
            current_script_index = batch_order[i];
            if (script_desc[current_script_index] === "hack") {
                current_timing = ns.getHackTime(target);
            } else if (script_desc[current_script_index] === "weaken") {
                current_timing = ns.getWeakenTime(target);
            } else if (script_desc[current_script_index] === "grow") {
                current_timing = ns.getWeakenTime(target);
            }
            if (current_timing > base_length) {
                base_length = current_timing;
                base_length_index = i;
            }
            timings.push(current_timing);
        }
        base_length -= base_length_index * batch_delay;

        for (var i = 0; i < batch_order.length; i++) {
            current_script_index = batch_order[i];
            allocation_left = Math.floor((ratio[i] * thread_dist.thread_count[server_index]) * (max_ram_usage / ram_usage[current_script_index]));
            post_delay = (batch_order.length - i - 1) * batch_delay;
            additional_m_sec = base_length + (i * batch_delay);
            while (thread_dist.thread_count[server_index] <= allocation_left) {
                ns.exec(batch_scripts[current_script_index], thread_dist.servers[server_index], thread_dist.thread_count[server_index], target, additional_m_sec, post_delay);
            }
        }
    }
}