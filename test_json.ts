try {
  JSON.parse('<html><head><title>Object moved</title></head><body><h1>Object moved</h1>This document may be found <a href="https://example.com">here</a></body></html>');
} catch (e) {
  console.log(e.message);
}
