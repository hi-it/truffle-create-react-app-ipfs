const Ninjya20 = artifacts.require('./Ninjya20.sol')

module.exports = (deployer) => {
  const initialSupply = 36900000e18 // トークン発行量が 36,900,000 NIN
  deployer.deploy(Ninjya20, initialSupply)
}