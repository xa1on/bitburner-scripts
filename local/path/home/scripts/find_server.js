/** @param {NS} ns */
export async function main(ns) {
    function find_server(start_loc, target) {
        var servers_seen = [start_loc];
        var server_path = [target];
        var scanned = null;
        for (var i = 0; i < servers_seen.length; i++) {
            scanned = ns.scan(servers_seen[i]);
            for (var j = 0; j < scanned.length; j++) {
                if (servers_seen.indexOf(scanned[j]) === -1) {
                    servers_seen.push(scanned[j]);
                }
                if (scanned[j] === server_path[server_path.length - 1]) {
                    server_path.push(servers_seen[i]);
                }
            }
        }
        return server_path;
    }
    ns.alert((find_server("home", ns.args[0])).toString());
}