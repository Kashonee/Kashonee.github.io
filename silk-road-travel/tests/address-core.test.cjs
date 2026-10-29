const assert=require('node:assert/strict'),A=require('../address-core.js');
const expected={lat:43.25,lon:76.95};
const check=url=>assert.deepEqual(A.parse(url).point,expected);
check('https://www.google.com/maps/search/?api=1&query=43.25%2C76.95');
check('https://maps.google.com/?q=43.25,76.95');
check('https://www.google.com/maps/place/Test/@40,70,15z/data=!3m1!4b1!4m6!3m5!1s123!8m2!3d43.25!4d76.95!16sXYZ');
check('Мекенжай: https://yandex.kz/maps/?whatshere%5Bpoint%5D=76.95%2C43.25');
check('https://yandex.kz/maps/?pt=76.95,43.25,pm2rdm');
check('https://2gis.kz/geo/76.95,43.25');check('https://2gis.ru/almaty/geo/76.95,43.25');
for(const url of ['https://www.google.com/maps/@43.25,76.95,17z','https://yandex.kz/maps/?ll=76.95,43.25&z=17','https://2gis.kz/almaty/firm/700000000?m=76.95,43.25/17']){const r=A.parse(url);assert.equal(r.status,'view');assert.deepEqual(r.center,expected);assert.equal(r.point,undefined);}
for(const url of ['https://maps.app.goo.gl/example','https://go.2gis.com/abcd','https://yandex.kz/maps/-/example','https://2gis.kz/almaty/firm/700000000','https://www.google.com/maps/place/A/data=!3d43!4d76!3d44!4d77'])assert.equal(A.parse(url).status,'unresolved');
for(const url of ['javascript:alert(1)','https://google.com.evil.test/maps/?q=43,76','https://user@google.com/maps/?q=43,76','https://www.google.com/search?q=43,76','https://yandex.kz/search?text=43,76','http://2gis.kz/geo/76,43','43,76'])assert.equal(A.parse(url).status,'invalid');
assert.equal(A.parse('https://www.google.com/maps/search/?query=91,76').point,undefined);assert.equal(A.point(null,null),null);assert.equal(A.point('',''),null);assert.equal(A.point(43,181),null);
assert.equal(A.parse('https://www.google.com/maps/dir/?api=1&origin=43,76&destination=44,77').point,undefined);
const query='Алматы, Абай 10 & қонақүй';const links=A.searchLinks(query);assert.equal(new URL(links.google).searchParams.get('query'),query);assert.equal(new URL(links.yandex).searchParams.get('text'),query);assert.ok(decodeURIComponent(links.dgis).endsWith(query));
for(const url of Object.values(A.pointLinks(expected)))check(url);
console.log('PASS: three providers, point formats and axis order, view centres not saved as destinations, opaque short links, invalid hosts/coordinates, search encoding and confirmation URLs.');
