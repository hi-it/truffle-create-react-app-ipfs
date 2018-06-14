pragma solidity ^0.4.23;
import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";

contract Ninjya20 is StandardToken {
  string public name = "Ninjya20";
  string public symbol = "NIN";
  uint public decimals = 18;

  /* constructor  */
  constructor(uint initialSupply) public {
    /* Ninjya20 コントラクトが継承している
       OpenZeppelin の StandardToken が持つ状態変数 */
    totalSupply_ = initialSupply;
    /* 発行したトークンを、全て msg.sender のアドレス（口座）に。
       msg.sender は、コントラクト実行者の Ethereum アドレスを表し、
       balances は、アドレスをキーとした key/value 型の変数 */
    balances[msg.sender] = initialSupply;
  }
}