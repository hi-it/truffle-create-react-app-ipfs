const HDWalletProvider = require("truffle-hdwallet-provider");
const config = require('./config');
const mnemonic = config.ROPSTEN_MNEMONIC;
const accessToken = config.INFURA_ACCESS_TOKEN;

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    ropsten: {
      provider: new HDWalletProvider(
        mnemonic,
        'https://ropsten.infura.io/' + accessToken
      ),
      network_id: 3, // ropstenのidは3
      gas: 1800000
    }
  }
};
