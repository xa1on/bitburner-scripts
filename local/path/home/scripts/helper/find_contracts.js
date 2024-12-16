/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.tail();
    function find_server(start_loc) {
        var servers_seen = [start_loc];
        var scanned = null;
        var found_contracts = null;
        for (var i = 0; i < servers_seen.length; i++) {
            scanned = ns.scan(servers_seen[i]);
            for (var j = 0; j < scanned.length; j++) {
                if (servers_seen.indexOf(scanned[j]) === -1) {
                    servers_seen.push(scanned[j]);
                    found_contracts = ns.ls(scanned[j], ".cct");
                    if (found_contracts.length > 0) {
                        ns.print(scanned[j] + ": " + found_contracts.toString());
                    }
                }
            }
        }
    }
    find_server("home");
}