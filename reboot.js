const axios = require('axios');


let interval = parseInt(process.argv[2]) || 60;
const MAX = parseInt(process.argv[3]) || 1;
let password = '';
let timer = 1;
const rebootUrlTamplate = `http://192.168.199.1/cgi-bin/turbo{{stok}}/proxy/call?_system.reboot`;
const loginUrlTamplate = `http://192.168.199.1/cgi-bin/turbo/api/login/login_admin?username=admin&password={{password}}`;
const data = {
    method: 'system.reboot',
    data: {},
    lang: 'zh-CN',
    version: 'v1'
};

function timeUtil() {
    let timer = new Date();
    let month = timer.getMonth() + 1;
    let day = timer.getDate();
    let hour = timer.getHours();
    let min = timer.getMinutes();
    let sec = timer.getSeconds();
    return `${month}-${day} ${hour}:${min}:${sec}`;
}

function routerReboot() {
    let loginUrl = loginUrlTamplate.replace('{{password}}', password);
    console.log(`${timeUtil()} router is rebooting of NO.${timer} rounds...`);
    axios
        //login for stok & cookie
        .get(loginUrl)
        // using stok & cookie to request reboot api
        .then(res => {
            let result;
            let stok = res.data.stok;
            // no stok whit unlogin
            if (stok) {
                let rebootUrl = rebootUrlTamplate.replace('{{stok}}', stok);
                let Cookie = res.headers['set-cookie'][0];
                //log
                console.log(`${timeUtil()} login success!`);
                console.log(`${timeUtil()} rebootUrl: `, rebootUrl);
                console.log(`${timeUtil()} Cookie: `, Cookie);
                //reboot request
                result = axios.post(rebootUrl, data, {
                    headers: { Cookie }
                });
            } else {
                //using default password because stok  is ''
                password = 'admin';
                console.log(`${timeUtil()} password is changed to default`);
            }
            return result;
        })
        .then(res => {
            if (res && res.status === 200) {
                console.log(`${timeUtil()} reboot success!`);
                return;
            }
            throw `${timeUtil()} response status error![${res ? res.status : 'login failed'}]`;
        })
        .catch(err => {
            console.log(`${timeUtil()} bad request!`);
            console.log(err);
        })
        //nodejs is not support .finally()
        .then(() => {
            console.log(`${timeUtil()} one round finish`);
        });

    return timer++ >= MAX ? false : true;
}

//main
{
    console.log(`${timeUtil()} a round of ${interval} seconds, totally ${MAX} rounds`);
    (function round() {
        setTimeout(() => {
            if (routerReboot()) {
                round();
            }
        }, interval * 1000);
    })();
}
