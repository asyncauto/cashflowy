module.exports = {
    /**
     * permitted styles
     * - Indian
     * - US
     */
    formatNumber2: function (number, number_format, precision) {
        precision = precision ? precision : 'decimal1';
        number_format = number_format ? number_format : 'indian';
        var p = parseInt(precision.substring(7, 8));
        if (number) {
            var output;
            switch (number_format) {
                case 'indian':
                    var n = '';
                    if (number < 0) {
                        number = -number;
                        n = '-';
                    }
                    number = number.toFixed(p);
                    var decimal = number.substring(number.length - p, number.length);
                    var whole_n = number.substring(0, number.length - p - 1);
                    var h = ''; //hundreds - up to 999 
                    var t = ''; // thousands up to 99 - 99 thousand
                    var l = ''; // lakhs - up to 99 - 99 lakhs
                    var c = ''; // crores

                    if (whole_n.length <= 3)// le
                        h = whole_n;
                    else if (whole_n.length <= 5) { // thousands
                        h = whole_n.substring(whole_n.length - 3);
                        t = whole_n.substring(0, whole_n.length - 3) + ',';
                    } else if (whole_n.length <= 7) { // in lakhs
                        h = whole_n.substring(whole_n.length - 3);
                        t = whole_n.substring(whole_n.length - 5, whole_n.length - 3) + ',';
                        l = whole_n.substring(0, whole_n.length - 5) + ',';
                    } else {
                        h = whole_n.substring(whole_n.length - 3);
                        t = whole_n.substring(whole_n.length - 5, whole_n.length - 3) + ',';
                        l = whole_n.substring(whole_n.length - 7, whole_n.length - 5) + ',';
                        c = whole_n.substring(0, whole_n.length - 7) + ',';
                    }
                    output = n + c + l + t + h;
                    break;
                case 'indian_thousand':
                    number /= 1000;
                    output = number.toFixed(p);
                    break;
                default:
                    output = '';
            }
            return output;
        } else {
            return ''
        }
    },

    formatNumber: function (number, number_format, precision) {
        if (!number) return '';
        precision = precision ? precision : 'decimal1';
        number_format = number_format ? number_format : 'indian';
        var p = parseInt(precision.substring(7, 8)) ? parseInt(precision.substring(7, 8)) : 0;
        var locale;
        var format_symbol;
        if (number_format.startsWith('indian')) {
            var format = number_format.substring(7)
            locale = 'en-IN';
            switch (format) {
                case 'thousand':
                    number = number / 1000;
                    format_symbol = 'k';
                    break;
                case 'lakh':
                    number = number / 100000;
                    format_symbol = 'l';
                    break;
                case 'crore':
                    number = number / 10000000;
                    format_symbol = 'cr';
                    break;
                default:
                    format_symbol = ''
                    break;
            };
        }
        else if (number_format.startsWith('us')) {
            var format = number_format.substring(3);
            locale = 'en-US';
            switch (format) {
                case 'thousand':
                    number = number / 1000;
                    format_symbol = 'k';
                    break;
                case 'million':
                    number = number / 1000000;
                    format_symbol = 'm';
                    break;
                case 'billion':
                    number = number / 1000000000;
                    format_symbol = 'b';
                    break;
                default:
                    format_symbol = ''
                    break;
            };
        }
        else {
            locale = 'en-IN';
        }
        // set pricision; if p=0 then pass
        number = p ? number.toFixed(p) : number;
        return number.toLocaleString(locale) + format_symbol
    }
}