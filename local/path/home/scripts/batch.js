/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("disableLog");
    ns.disableLog("kill");
    ns.disableLog("run");
    ns.disableLog("getServerMinSecurityLevel");
    ns.disableLog("nuke");
    ns.disableLog("brutessh");
    ns.disableLog("sqlinject");
    ns.disableLog("httpworm");
    ns.disableLog("ftpcrack");
    ns.disableLog("relaysmtp");
    ns.disableLog("getServerNumPortsRequired");
    ns.disableLog("scp");
    ns.disableLog("killall");
    ns.disableLog("getServerMaxRam");
    ns.disableLog("getServerUsedRam");
    ns.disableLog("sleep");
    ns.disableLog("getHackingLevel");
    ns.disableLog("scan");
    ns.disableLog("exec");
    ns.disableLog("getServerRequiredHackingLevel");
    ns.disableLog("getServerMaxMoney");
    ns.disableLog("getServerSecurityLevel");
    ns.disableLog("getServerMoneyAvailable");

    const hostfile = "home";
    const script_dir = "scripts"; // script folder
    const script_type_dir = "batch"; // script type folder
    const this_file = script_dir + "/" + "batch.js";
    const created_server_ram_usage = 8; // starting amount of ram for servers
    var batch_scripts = ["hack_only.js", "weaken_only.js", "grow_only.js"]; // scrips used for batch run
    var script_desc = ["hack", "weaken", "grow"];
    // include script_dir & script_type to get correct directory
    for (var i = 0; i < batch_scripts.length; i++) { batch_scripts[i] = script_dir + "/" + script_type_dir + "/" + batch_scripts[i]; }
    var ram_usage = [1.70, 1.75, 1.75];
    var batch_order = [0, 1, 2, 1]; // order that batch_scripts should run with index
    var ratio = [0.01, 0.33, 0.33, 0.33]; // ratio corresponding to script of same index in batch_order
    const batch_delay = 100; // delay between items in batch
    const use_timing = true;
    const home_buffer = 8;
    var wait_time = null;

    const ports = ["NUKE.exe", "BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];
    const port_func = [{f: ns.nuke}, {f: ns.brutessh}, {f: ns.ftpcrack}, {f: ns.relaysmtp}, {f: ns.httpworm}, {f: ns.sqlinject}];

    var growth_phase_order = [1, 2];
    var growth_phase_ratio = [0.5, 0.5];

    var target = null;
    var grow_phase;
    var previous_target = {target: null, port_level: 0, servers: []};

    // server ugpader
    var ram = null;
    var server_prefix = "pserv";
    var p_servers = ns.getPurchasedServers();
    var total_servers = p_servers.length;
    var hostname;
    const server_limit = 25;
    var cost = null;
    var current_server_ram = null;
    var bal = null;

    var money_postfix = ["", "k", "m", "b", "t"];
    function moneyToString(amount) {
        var index = 0;
        while (amount / 1000 >= 1) {
            amount /= 1000;
            index++;
        }
        return Math.round(amount * 100) / 100 + money_postfix[index];
    }

    // calculate the maximum amount of ports we can bypass
    function calculate_port_level() {
        for (var i = 0; i < ports.length; i++) {
            if (!ns.fileExists(ports[i], hostfile)) {
                return i - 1;
            }
        }
        return 5;
    }

    // returns a list of all servers
    function getAllServers() {
        var servers_seen = [hostfile];
        for (var k = 0; k < arguments.length; k++) {
            arguments[k](hostfile);
        }
        var scanned = null;
        for (var i = 0; i < servers_seen.length; i++) {
            scanned = ns.scan(servers_seen[i]);
            for (var j = 0; j < scanned.length; j++) {
                if (servers_seen.indexOf(scanned[j]) === -1) {
                    servers_seen.push(scanned[j]);
                    for (var k = 0; k < arguments.length; k++) {
                        arguments[k](scanned[j]);
                    } 
                }
            }
        }
        return servers_seen;
    }

    function getTarget(...args) {
        var target;
        var greatest_max_money = 0;
        var max_money;
        var port_level = calculate_port_level();
        var ports_required = 0;
        var servers = getAllServers(function (server) {
            ports_required = ns.getServerNumPortsRequired(server);
            if (server !== hostfile && ports_required <= port_level) {
                for (var i = ports_required; i >= 0; i--) {
                    port_func[i]["f"](server);
                }
                max_money = ns.getServerMaxMoney(server);
                if (ns.getServerRequiredHackingLevel(server) <= Math.max(ns.getHackingLevel() * 0.8, 1) && max_money > greatest_max_money) {
                    greatest_max_money = max_money;
                    target = server;
                }
            }
        }, ...args);
        return {target: target, port_level: port_level, servers: servers};
    }

    // returns a dictionary containing the total amount of threads and threads per server based on index
    function getThreadDist(ram_use, ...args) {
        var threads = [];
        var total = 0;
        var available_threads;
        var max_ram;
        var servers = getAllServers(...args, function (server) {
            max_ram = ns.getServerMaxRam(server);
            if (server === hostfile) {
                max_ram -= home_buffer;
            }
            available_threads = Math.floor((max_ram - ns.getServerUsedRam(server)) / ram_use);
            threads.push(available_threads);
            total += available_threads;
        });
        return {total: total, thread_count: threads, servers: servers};
    }

    // uses ratio to allocate the best number of threads in the order specified
    function allocateThreads(target, batch_scripts, script_desc, ram_usage, batch_order, ratio, batch_delay, use_timing, ...args) {
        var max_ram_usage = Math.max(...ram_usage)
        var thread_dist = getThreadDist(max_ram_usage, function (server) {
            if (server !== hostfile) {
                ns.killall(server);
                for (var i = 0; i < batch_scripts.length; i++) {
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
        }, ...args);

        var allocation_left;
        var server_index = 0;
        var current_script_index;
        var base_length = 0;
        var base_length_index;
        var current_timing;
        var timings = [];
        var post_delay = 0;
        var additional_m_sec_base = 0;
        var additional_m_sec = 0;

        for (var i = 0; i < batch_order.length; i++) {
            current_script_index = batch_order[i];
            if (script_desc[current_script_index] === "hack") {
                current_timing = ns.getHackTime(target);
            } else if (script_desc[current_script_index] === "weaken") {
                current_timing = ns.getWeakenTime(target);
            } else if (script_desc[current_script_index] === "grow") {
                current_timing = ns.getGrowTime(target);
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
            allocation_left = Math.floor((ratio[i] * thread_dist["total"]));/** (max_ram_usage / ram_usage[current_script_index]) **/
            if (use_timing) {
                post_delay = (batch_order.length - i - 1) * batch_delay;
                additional_m_sec_base = base_length + (i * batch_delay);
                additional_m_sec = additional_m_sec_base - timings[i];
            }
            while (thread_dist["thread_count"][server_index] <= allocation_left && allocation_left > 0) {
                if (thread_dist["thread_count"][server_index] > 0) {
                    ns.exec(batch_scripts[current_script_index], thread_dist["servers"][server_index], thread_dist["thread_count"][server_index], target, additional_m_sec, post_delay);
                    allocation_left -= thread_dist["thread_count"][server_index];
                }
                server_index++;
            }
            if (allocation_left > 0) {
                ns.exec(batch_scripts[current_script_index], thread_dist["servers"][server_index], allocation_left, target, additional_m_sec, post_delay);
                thread_dist["thread_count"][server_index] -= allocation_left;
            }
        }
        return base_length + (batch_order.length * batch_delay);
    }

    function serverUpgrader(created_server_ram_usage) {
        for (var i = 0; i < server_limit; i++) {
            p_servers = ns.getPurchasedServers();
            total_servers = p_servers.length;
            bal = ns.getServerMoneyAvailable("home");
            if (i >= total_servers) {
                ram = created_server_ram_usage;
            } else {
                current_server_ram = ns.getServerMaxRam(p_servers[i]);
                ram = current_server_ram * 2;
            }
            while (bal >= ns.getPurchasedServerCost(ram * 2)){
                ram *= 2;
            }
            cost = ns.getPurchasedServerCost(ram);
            if (bal >= cost) {
                if (i < total_servers) {
                    ns.print("DELETING: " + p_servers[i] + ", RAM: " + current_server_ram + "GB");
                    ns.killall(p_servers[i]);
                    ns.deleteServer(p_servers[i]);
                }
                hostname = ns.purchaseServer(server_prefix, ram);
                ns.print("BOUGHT: " + hostname + ", COST: " + cost + ", RAM: " + ram + "GB");
                total_servers++;
            }
        }
    }

    function runBatch(target, grow, debug) {
        var wait_time;
        if (debug) {
            ns.print("PORT LEVEL: " + target["port_level"]);
            for (var i = 0; i < target["servers"].length; i++) {
                ns.print("[" + target["servers"][i] + "]");
            }
        }
        if (grow) {
            wait_time = allocateThreads(target["target"], batch_scripts, script_desc, ram_usage, growth_phase_order, growth_phase_ratio, 0, use_timing);
        } else {
            wait_time = allocateThreads(target["target"], batch_scripts, script_desc, ram_usage, batch_order, ratio, batch_delay, use_timing);
        }
        // sets up server upgrader and server stat board
        var seconds = Math.floor(wait_time / 1000);
        var minutes = Math.floor(seconds / 60);
        ns.print("\nBatch Started (Grow Phase: " + grow + "): " + target["target"] + " (" + minutes + "m " + (seconds - minutes * 60) + "s)");
        ns.print("MONEY: " + moneyToString(ns.getServerMoneyAvailable(target["target"])) + "/" + moneyToString(ns.getServerMaxMoney(target["target"])) + ", SECURITY: " + ns.getServerSecurityLevel(target["target"]) + " - " + ns.getServerMinSecurityLevel(target["target"]));
        return wait_time;
    }

    function getGrowPhase(target) {
        return ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target) || ns.getServerMinSecurityLevel(target) > ns.getServerSecurityLevel(target);
    }

    ns.tail();
    
    while (true) {
        target = getTarget();
        if (previous_target["target"] !== target["target"] || previous_target["servers"].length !== previous_target["servers"].length) {
            grow_phase = getGrowPhase(target["target"]);
            wait_time = runBatch(target, grow_phase, true);
        } else if (grow_phase) {
            grow_phase = getGrowPhase(target["target"]);
            wait_time = runBatch(target, grow_phase);
        } else {
            wait_time = runBatch(previous_target, false);
        }
        await ns.sleep(wait_time);
        previous_target = target;
        ns.print("Batch Finished.");
        serverUpgrader(created_server_ram_usage);
    }
}