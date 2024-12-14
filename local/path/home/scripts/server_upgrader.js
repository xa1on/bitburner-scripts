/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    const script_dir = "scripts/";
    const required_files = [script_dir + "grow_only.js", script_dir + "hack_only.js", script_dir + "weaken_only.js"];
    var ram = null;
    var server_prefix = "pserv";
    var p_servers = ns.getPurchasedServers();
    var total_servers = p_servers.length;
    var hostname;
    var server_limit = 25;
    var cost = null;
    var current_server_ram = null;
    var threads = 1;
    var bal = null;
    while (true) {
        for (var i = 0; i < server_limit; i++) {
            p_servers = ns.getPurchasedServers();
            total_servers = p_servers.length;
            bal = ns.getServerMoneyAvailable("home");
            if (i >= total_servers) {
                ram = ns.args[0];
            } else {
                current_server_ram = ns.getServerMaxRam(p_servers[i]);
                ram = current_server_ram * 2;
                while (bal >= ns.getPurchasedServerCost(ram * 2)){
                    ram *= 2;
                }
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
                for (var ii = 0; ii < required_files.length; ii++) {
                    ns.scp(required_files[ii], hostname);
                }
                ns.scp(ns.args[1], hostname);
                if (ns.args[2]) {
                    threads = Math.floor(ram / ns.args[3]);
                }
                ns.exec(ns.args[1], hostname, threads, ns.args[4], ns.args[5], ns.args[6]);
                total_servers++;
            }
        }
        await ns.sleep(120000);
    }
}