
export function timestamp_to_date(timestamp){
    // JJ/MM/AAAA
    var date = new Date(timestamp * 1000);
    var d = date.getDate().toString();
    var m = (date.getMonth() + 1).toString();
    var y = date.getFullYear().toString();

    if (d.length < 2)
        d = '0' + d;
    if (m.length < 2)
        m = '0' + m;

    return d + '/' + m + '/' + y;

}

export function timestamp_to_hhmmss(timestamp){
    // HH:MM:SS
    var date = new Date(timestamp * 1000);
    var h = date.getHours().toString();
    var m = date.getMinutes().toString();
    var s = date.getSeconds().toString();


    if (h.length < 2)
        h = '0' + h;
    if (m.length < 2)
        m = '0' + m;
    if (s.length < 2)
        s = '0' + s;
    return h + ':' + m + ':' + s;
}

export function timestamp_to_date_hour(timestamp){
    return timestamp_to_date(timestamp) + ' ' + timestamp_to_hhmmss(timestamp);
}


export function num_to_hex(num:number):string{
    var hex = num.toString(16);
    if (hex.length < 2)
        hex = '0' + hex;
    return hex;
}

export function float_to_string(value:number, precision:number):string{
    var str = value.toFixed(precision);
    return str;
}


export function createElementFromHTML(htmlString:string):HTMLElement {
    var div:HTMLElement = document.createElement('div');
    div.innerHTML = htmlString.trim();

    // Change this to div.childNodes to support multiple top-level nodes.
    return div.firstChild as HTMLElement;
  }



  export function hash_string(str:string) {
    var hash = 0,
      i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }