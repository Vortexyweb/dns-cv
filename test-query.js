const { UDPClient } = require('dns2');

const resolve = UDPClient({
  dns: '127.0.0.1',
  port: 1053
});

// Get section from command line arguments (e.g. node test-query.js skills)
// Defaults to 'bio' if no argument is passed
const section = process.argv[2] || 'bio';
const queryTarget = `${section}.cv.local`;

console.log(`Enviando consulta DNS TXT para ${queryTarget} na porta 1053...`);

(async () => {
  try {
    const response = await resolve(queryTarget, 'TXT');
    if (response.answers && response.answers.length > 0) {
      response.answers.forEach((ans) => {
        const text = Array.isArray(ans.data) ? ans.data.join(' ') : ans.data;
        console.log(text);
      });
    } else {
      console.log('Nenhum registro TXT encontrado.');
    }
  } catch (err) {
    console.error('Erro na consulta DNS:', err.message);
  }
})();
