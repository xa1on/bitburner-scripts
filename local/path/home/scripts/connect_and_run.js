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
    ns.disableLog("getServerRequiredHackingLevel");
    ns.disableLog("getServerMaxMoney");
    ns.disableLog("exec");
    ns.disableLog("getServerSecurityLevel");
    ns.disableLog("getServerMoneyAvailable");

    // config
    const script_dir = "scripts/";
    const hostfile = "home";
    const this_file = script_dir + "connect_and_run.js";
    // const file = script_dir + "share_only.js";
    const file = script_dir + "loop_algo.js"; // script to run on each server
    const required_files = [script_dir + "grow_only.js", script_dir + "hack_only.js", script_dir + "weaken_only.js"]; // files to add to found servers
    const filler = script_dir + "grow_only.js"; // filler script for excess ram (only if using auto_thread_max)
    const server_purchaser = script_dir + "server_upgrader.js"; // server upgrader script
    const created_server_ram_usage = 8; // amount of ram each server should start with
    const auto_thread_max = false; // max out threads, false for loop algo
    const delay = 200;

    const ram_use = ns.getScriptRam(file);
    const filler_ram_use = ns.getScriptRam(filler);
    var max_ram = null;
    var threads = 1;
    var filler_threads = null;
    var current = null;
    var current_max_ports = 0; // number of ports we can bypass
    var target = null; // best server to attack
    var previous_target = null;
    var target_cash_max = null; // max money of target
    var target_sec_min = null; // minimum security level of target
    var servers = null; // all servers. every single one of them
    var player_level = 0;
    var scripts_running = null;
    var prev_ssl = null;
    var prev_sma = null;
    var cur_ssl = null;
    var cur_sma = null;
    var run_server_upgrader = null;
    var tails = [];
    ns.tail();

    // calcualte the number of ports we can bypass
    if (ns.fileExists("SQLInject.exe", hostfile)) {
        current_max_ports = 5;
    } else if (ns.fileExists("HTTPWorm.exe", hostfile)) {
        current_max_ports = 4;
    } else if (ns.fileExists("relaySMTP.exe", hostfile)) {
        current_max_ports = 3;
    } else if (ns.fileExists("FTPCrack.exe", hostfile)) {
        current_max_ports = 2;
    } else if (ns.fileExists("BruteSSH.exe", hostfile)) {
        current_max_ports = 1;
    }
    ns.print("PORT LEVEL: " + current_max_ports);
    

    function crack(server) {
        var ports_required = ns.getServerNumPortsRequired(server);
        if (ports_required <= current_max_ports) {
            if (ports_required >= 5) {
                ns.sqlinject(server);
            }
            if (ports_required >= 4) {
                ns.httpworm(server);
            }
            if (ports_required >= 3) {
                ns.relaysmtp(server);
            }
            if (ports_required >= 2) {
                ns.ftpcrack(server);
            }
            if (ports_required >= 1) {
                ns.brutessh(server);
            }
            if (ports_required >= 0) {
                ns.nuke(server);
            }
            return true;
        } else {
            return false;
        }
    }

    // get all servers.
    function get_all_servers() {
        var servers_seen = [hostfile];
        var scanned = null;
        var scanned_req_level = 0;
        var scanned_cash = null;
        for (var i = 0; i < servers_seen.length; i++) {
            scanned = ns.scan(servers_seen[i]);
            for (var j = 0; j < scanned.length; j++) {
                if (servers_seen.indexOf(scanned[j]) === -1) {
                    servers_seen.push(scanned[j]);
                    scanned_req_level = ns.getServerRequiredHackingLevel(scanned[j]);
                    scanned_cash = ns.getServerMaxMoney(scanned[j]);
                    if (current_max_ports >= ns.getServerNumPortsRequired(scanned[j]) && scanned_req_level <= player_level * 0.5 && scanned_cash > target_cash_max) {
                        target_cash_max = scanned_cash;
                        target = scanned[j];
                    }
                }
            }
        }
        return servers_seen;
    }

    while (true) {
        player_level = ns.getHackingLevel();
        servers = get_all_servers();
        if (previous_target !== target) {
            for (var i = 0; i < tails.length; i++) {
                ns.closeTail(tails[i]);
            }

            target_sec_min = ns.getServerMinSecurityLevel(target);
            crack(target);
            
            await ns.sleep(1000);

            for (var i = 0; i < servers.length; i++) {
                current = servers[i];
                if (ns.hasRootAccess(current) || crack(current)) {
                    if (current === hostfile) {
                        scripts_running = ns.ps(hostfile);
                        for (var ii = 0; ii < scripts_running.length; ii++) {
                            if (scripts_running[ii]["filename"] !== this_file) {
                                ns.kill(scripts_running[ii]["pid"]);
                            }
                        }
                        run_server_upgrader = ns.run(server_purchaser, 1, created_server_ram_usage, file, auto_thread_max, ram_use, target, target_cash_max, target_sec_min);
                        ns.tail(run_server_upgrader);
                        ns.moveTail(100, 100, run_server_upgrader);
                        tails.push(run_server_upgrader);
                    } else {
                        ns.killall(current);
                    }
                    max_ram = ns.getServerMaxRam(current) - ns.getServerUsedRam(current);
                    try {
                        if (auto_thread_max) {
                            threads = Math.floor(max_ram / ram_use);
                            filler_threads = Math.floor((max_ram - ram_use * threads) / filler_ram_use);
                            if (filler_threads > 0) {
                                ns.scp(filler, current);
                                ns.exec(filler, current, filler_threads, target);
                            }
                        }
                        
                        if (max_ram >= ram_use) {
                            ns.print("[" + current + "]");
                            ns.scp(file, current);
                            for (var ii = 0; ii < required_files.length; ii++) {
                                ns.scp(required_files[ii], current);
                            }
                            ns.exec(file, current, threads, target, target_cash_max, target_sec_min);
                        }
                    } catch (error){
                        ns.print(error);
                    }
                    await ns.sleep(delay);
                }
            }
            ns.print("\nFinished targetting: " + target);
            previous_target = target;
        }
        cur_ssl = ns.getServerSecurityLevel(target);
        cur_sma = ns.getServerMoneyAvailable(target);
        if (prev_ssl !== cur_ssl) {
            ns.print("SECURITY [" + target + "]: " + Math.round(cur_ssl) + ", MIN: " + target_sec_min);
        }
        if (prev_sma !== cur_sma) {
            ns.print("MONEY [" + target + "]: " + Math.round(cur_sma) + ", MAX: " + target_cash_max);
        }
        prev_ssl = cur_ssl;
        prev_sma = cur_sma;
        await ns.sleep(40);
    }
}