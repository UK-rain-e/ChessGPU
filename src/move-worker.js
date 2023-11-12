self.onmessage = function(e) {
    const { url, token, move } = e.data;
  
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-cors-api-key': 'live_14b9ef05b52ee5d857f47f364e4545cb026620dba7797bcf5c0b2e2e7536470f' },
        body: JSON.stringify({ token, move })
    })
    .then(response => response.json())
    .catch(err => {
        postMessage({ error: err.message });
    });
};
  