import http from 'http';

http.get('http://localhost:3000/api/steam-predictions?event=22&key=6TE7-HL9HY-C9%0A&steamid=7656119907623%0A&developerkey=536BF84F671FD4E5733F111111111111', {
  headers: {
    'Accept': 'application/json'
  }
}, (r) => {
  console.log('Status:', r.statusCode);
  let data = '';
  r.on('data', d => data += d);
  r.on('end', () => console.log('Data:', data.substring(0, 200)));
});
