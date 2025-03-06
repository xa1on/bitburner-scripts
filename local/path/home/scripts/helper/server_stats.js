/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    var prev_ssl = null;
    var prev_smsl = null;
    var prev_sma = null;
    var prev_smm = null;
    var cur_ssl = null;
    var cur_smsl = null;
    var cur_sma = null;
    var cur_smm = null;
    var target = ns.args[0];
    ns.tail();
    ns.clearLog();
    while (true) {
        cur_ssl = ns.getServerSecurityLevel(target);
        cur_smsl = ns.getServerMinSecurityLevel(target);
        cur_sma = ns.getServerMoneyAvailable(target);
        cur_smm = ns.getServerMaxMoney(target);
        if (prev_ssl !== cur_ssl || prev_smsl !== cur_smsl) {
            ns.print("SECURITY: " + cur_ssl + ", MIN: " + cur_smsl);
        }
        if (prev_sma !== cur_sma || prev_smm !== cur_smm) {
            ns.print("MONEY: " + cur_sma + ", MAX: " + cur_smm);
        }

        prev_ssl = cur_ssl;
        prev_smsl = cur_smsl;
        prev_sma = cur_sma;
        prev_smm = cur_smm;
        await ns.sleep(40);
    }
}