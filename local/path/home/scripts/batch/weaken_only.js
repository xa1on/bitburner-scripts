/** @param {NS} ns */
export async function main(ns) {
    while(true) {
        await ns.weaken(ns.args[0], {additionalMsec: ns.args[1]});
        await ns.sleep(ns.args[2]);
    }
}