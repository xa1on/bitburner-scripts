/** @param {NS} ns */
export async function main(ns) {
    ns.ui.openTail();
    function solveTotalSumOne(data) {
        let autoSolv = [1, 1, 2, 3, 5, 7, 11, 15, 22, 30, 42, 56, 77, 101, 135, 176, 231, 297, 385,
                490, 627, 792, 1002, 1255, 1575, 1958, 2436, 3010, 3718, 4565, 5604, 6842,
                8349, 10143, 12310, 14883, 17977, 21637, 26015, 31185, 37338, 44583, 53174,
                63261, 75175, 89134, 105558, 124754, 147273, 173525, 204226, 239943, 281589,
                329931, 386155, 451276, 526823, 614154, 715220, 831820, 966467, 1121505,
                1300156, 1505499, 1741630, 2012558, 2323520, 2679689, 3087735, 3554345,
                4087968, 4697205, 5392783, 6185689, 7089500, 8118264, 9289091, 10619863,
                12132164, 13848650, 15796476, 18004327, 20506255, 23338469, 26543660];
        if (data < autoSolv.length) {
            return autoSolv[data];
        }

        let result = 0;

        let neg = false;
        let k = 1;
        let val = 1;
        let negCalc = false;

        while (data >= val) {
            result += solveTotalSumOne(data - val) * (negCalc ? -1 : 1);
            if (neg) {
                neg = false;
                k++;
                val = (((neg ? -1 : 1) * k) * (((3 * ((neg ? -1 : 1) * k)) - 1) / 2));
                if (negCalc) {
                    negCalc = false
                } else {
                    negCalc = true;
                }
            } else {
                neg = true;
                val = (((neg ? -1 : 1) * k) * (((3 * ((neg ? -1 : 1) * k)) - 1) / 2));
            }
        }
        return result;
    }
    ns.print(solveTotalSumOne(ns.args[0]));
}