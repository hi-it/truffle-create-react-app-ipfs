import React, { Component } from 'react';

// truffleで生成した、buildフォルダをsrc以下に配置したもの。
import Ninjya20Json from './build/contracts/Ninjya20.json';
const contractAddress = '0x42824c434c8021e4d9cda5bc2a829010a6b5bb0b';
const abiArray = Ninjya20Json.abi;


class MyToken extends Component {
  constructor(props) {
    super(props);

    this.state = {
      netId: '', // RopstenのnetIdは3
      defaultAccount: '', // 選択されているEhtereumアカウント
      contract: {}, // window.web3.eth.contract(abiArray).at(contractAddress);
      name: '', // トークンの名前
      symbol: '', // トークンのシンボル
      balance: '', // トークンをいくら所持しているか
      to: '', // 送金先アドレス
      amount: 0, // 送金する量
      history: '', // 送金トランザクションのハッシュ
      error: null, // 通信エラーなどが入る
      noMetaMask: false, // MetaMaskがあるかどうか
    }

    this.onClick = this.onClick.bind(this)
  }

  // MyToken コンポーネントがマウントされた時実行するもの
  async componentDidMount() {
    // MetaMaskが入っていれば通る
    if(window.web3) {
      try {
        // Ropsten Netかチェック
        await this.onlyRopstenTestNetwork();
        // コントラクトから情報を取得
        await this.getStateFromContract();
      } catch(error) {
        this.setState({ error });
      }
    } else {
      this.setState({ noMetaMask: true });
    }
  }

  // RopstenのnetIdは3なのでそうでない場合は繋ぎ先を変更するように求める。
  async onlyRopstenTestNetwork() {
    return new Promise((resolve, reject) => {
      window.web3.version.getNetwork((err, netId) => {
        if(netId === "3") this.setState({ netId });
        resolve()
      });
    }).catch((error) => {
      this.setState({ error })
    });
  }

  // コントラクトから情報を取得
  async getStateFromContract() {
    return new Promise((resolve, reject) => {
      // MetaMaskの現在のアカウント
      const defaultAccount = window.web3.eth.defaultAccount;
      if(!defaultAccount) throw new Error('Please login to MetaMask');
      this.setState({ defaultAccount });
      // コントラクト情報取得
      const contract = window.web3.eth.contract(abiArray).at(contractAddress);
      this.setState({ contract });
      contract.name((err, name) => {
        if(err) throw err;
        this.setState({ name });
        contract.symbol((err, symbol) => {
          if(err) throw err;
          this.setState({ symbol });
          console.log('state: ', this.state)
          contract.balanceOf(defaultAccount, (err, balance) => {
            if(err) throw err;
            this.setState({ balance });
            resolve();
          });
        });
      });

    }).catch((error) => {
      this.setState({ error })
    });
  }

  // token量を計算
  showBalance(balance) {
    return (balance / 1e18).toFixed(2);
  }

  // 送金
  async onClick(e) {
    return new Promise((resolve, reject) => {
      const { defaultAccount, amount, contract, to } = this.state;
      const sendAmount = amount * 1e18;
      contract.transfer(to, sendAmount, {from: defaultAccount}, (err, txhash) => {
        if(err) throw err;
        this.setState({ history: txhash });
        contract.balanceOf(defaultAccount, (err, balance) => {
          this.setState({ balance });
          resolve()
        });
      });

    }).catch((error) => {
      this.setState({ error });
    })
  }

  // 描画
  render() {
    const { netId, name, defaultAccount, balance, symbol, amount, history, noMetaMask, error } = this.state;
    return (
      <div className="MyToken">
        { noMetaMask && <em style={{color: "red"}}>MetaMask is not detected, first please install <a href="https://metamask.io/">MetaMask</a></em> }

        <h1>{name} Wallet</h1>

        { netId !== "3" && <em>Please switch MetaMask to Ropsten Test Network and reload page.</em> }
        { error && <p>{error.message}</p> }

        <p>あなたのアドレス: {defaultAccount}</p>
        <p>{name}の保有量: {this.showBalance(balance)} {symbol}</p>
        <p>
          送金先: <br />
          <input
            type="text"
            placeholder="address"
            onChange={event => this.setState({ to: event.target.value })}
          />
        </p>
        <p>
          送る量: <br />
          <input
            type="number"
            value={amount}
            onChange={event => this.setState({ amount: event.target.value })}
          />
        </p>
        <p>
          <button onClick={this.onClick}>送金</button>
        </p>
        <p>
          送金履歴: <a href={`https://ropsten.etherscan.io/tx/${history}`}>{history}</a>
        </p>
      </div>
    );
  }
}

export default MyToken;
