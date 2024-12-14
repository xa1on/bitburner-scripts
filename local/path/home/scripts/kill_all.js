/** @param {NS} ns */
export async function main(ns) {
    function get_all_servers() {
        var servers_seen = ["home"];
        var scanned = null;
        for (var i = 0; i < servers_seen.length; i++) {
            scanned = ns.scan(servers_seen[i]);
            for (var j = 0; j < scanned.length; j++) {
                if (servers_seen.indexOf(scanned[j]) === -1) {
                    servers_seen.push(scanned[j]);
                }
            }
        }
        return servers_seen;
    }

    var servers = get_all_servers();
    for (var i = 0; i < servers.length; i++) {
        ns.killall(servers[i]);
    }
}