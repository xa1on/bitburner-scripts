 /** @param {NS} ns **/
 export async function main(ns) {
    ns.tprint(Date.now());
    await ns.sleep(5000);
    ns.tprint(Date.now());
}