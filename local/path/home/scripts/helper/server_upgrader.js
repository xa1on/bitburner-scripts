/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    var ram = null;
    var server_prefix = "pserv";
    var p_servers = ns.getPurchasedServers();
    var total_servers = p_servers.length;
    var hostname;
    var server_limit = 25;
    var cost = null;
    var current_server_ram = null;
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
        await ns.sleep(120000);
    }
}