module.exports={
    /**
     * permitted styles
     * - Indian
     * - US
     */
    formatNumber:function(number,number_format,precision){
        precision = precision ? precision : 'decimal1';
        number_format = number_format ? number_format : 'indian';
        var p = parseInt(precision.substring(7, 8));
        if(number){
            var output;
            switch (number_format){
                case 'indian':
                    var n='';
                    if(number<0){
                        number=-number;
                        n='-';
                    }
                    number = number.toFixed(p);
                    var decimal = number.substring(number.length - p, number.length);
                    var whole_n = number.substring(0, number.length - p - 1);
                    var h=''; //hundreds - up to 999 
                    var t=''; // thousands up to 99 - 99 thousand
                    var l=''; // lakhs - up to 99 - 99 lakhs
                    var c=''; // crores

                    if(whole_n.length<=3)// le
                        h=whole_n;
                    else if(whole_n.length<=5){ // thousands
                        h = whole_n.substring(whole_n.length - 3);
                        t = whole_n.substring(0, whole_n.length - 3)+',';
                    }else if(whole_n.length<=7) { // in lakhs
                        h = whole_n.substring(whole_n.length - 3);
                        t = whole_n.substring(whole_n.length - 5, whole_n.length - 3) + ',';
                        l = whole_n.substring(0, whole_n.length - 5) + ',';
                    }else {
                        h = whole_n.substring(whole_n.length - 3);
                        t = whole_n.substring(whole_n.length - 5, whole_n.length - 3) + ',';
                        l = whole_n.substring(whole_n.length - 7, whole_n.length - 5) + ',';
                        c = whole_n.substring(0, whole_n.length - 7) + ',';
                    }
                    output=n+c+l+t+h;
                    break;
                case 'indian_thousand':
                    number/=1000;
                    output=number.toFixed(p);
                    break;
                default:
                    output='';
            }
            return output;
        }else{
            return ''
        }
    },
    
}