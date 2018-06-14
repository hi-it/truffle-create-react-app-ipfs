# truffle-create-react-app-ipfs

ninjya20とninjya20sendは、それぞれtruffleで作られたフォルダとcreate-react-appで作られたフォルダ。
コンテンツを読み進めていけば２つのフォルダの内容のものができる。

ipfsに上げたものはこちらから。 https://ipfs.io/ipfs/QmeEcKokMCuReSjzLUTZP6g6Wbj63xGSAWG6iaBB6bydFH/

## 環境

* macOS Hig Sierra 10.13.5
* nodejs : v8.11.1
* Google Chrome : 66.0.3359.181

* truffle : v4.1.11
* metamask : 4.7.4
* create-react-app : 1.5.2
* ipfs : 0.4.15

## コンテンツ
Ethereum Advent Calendar 2017をざっと見て半分まで来たので、今までの復習を兼ねて。
erc20トークンをtruffleを使用し作成、RopstenTestNetに公開、MetaMaskと連携しトークンを送信できるWebページをcreate-react-appを元に作成し、ipfs上にて公開する。

* ERC20 トークンとは

以下の6つのfunctionと2つのeventを実装すればERC20トークン。

```
contract ERC20 {
  function totalSupply() constant returns (uint totalSupply);
  function balanceOf(address _owner) constant returns (uint balance);
  function transfer(address _to, uint _value) returns (bool success);
  function transferFrom(address _from, address _to, uint _value) returns (bool success);
  function approve(address _spender, uint _value) returns (bool success);
  function allowance(address _owner, address _spender) constant returns (uint remaining);
  event Transfer(address indexed _from, address indexed _to, uint _value);
  event Approval(address indexed _owner, address indexed _spender, uint _value);
}
```

#### 1. truffleでトークン作成

truffleとは [The most popular Ethereum development framework](https://github.com/trufflesuite/truffle)。

truffleをインストール。

```
$ npm install -g truffle
```

適当なフォルダを作成し、初期化。

```
$ mkdir ninjya20
$ cd ninjya20
$ truffle init
```

以下の構成が出来る。

```
.
├── contracts
│   └── Migration.sol
├── migrations
│   └── 1_initial_migration.js
├── test
├── truffle-config.js
└── truffle.js
```

erc20トークンを作るには[OpenZeppelin](https://openzeppelin.org/)というライブラリを使うと便利。
先ほどのninjya20フォルダで以下を実行。

```
$ npm init -f
$ npm i zeppelin-solidity
```

Solidityコードを以下のように作成。

```
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
```

Solidityコードのコンパイル。

```
$ truffle compile
```

`build/contracts`以下に`json`ファイルが生成される。

migrationsフォルダに2_deploy_ninjya20.jsファイルを以下のように作成。

```
const Ninjya20 = artifacts.require('./Ninjya20.sol')

module.exports = (deployer) => {
  const initialSupply = 36900000e18 // トークン発行量が 36,900,000 NIN
  deployer.deploy(Ninjya20, initialSupply)
}
```

あとはデプロイすればトークンをネットワーク内で扱えるようになる。

#### 2.RopstenTestNetに公開

あらかじめMetaMaskをChromeブラウザーに追加し、Ropstenで使えるイーサを取得しておく。登録の際のパスフレーズは後々使うので控えておく。MetaMaskは拡張機能で、ブラウザー上でイーサの送金などを行ってくれる便利なウォレットです。

Ethereumでは以下の３つの形態のP2Pネットワークを構築しブロックチェーンを運用していくことが可能。

* パブリック・ネットワーク
* コンソーシアム・ネットワーク
* プライベート・ネットワーク

パブリックなネットワークに接続するためには、普通Ethereumブロックチェーンノードを構築しなければならない。
Ethereumブロックチェーンノードの実行と同期は時間がかかり、大量のストレージを必要。
[infura](https://infura.io/)というサービスを使うと、Ethereumノードを自分でたてずにネットワークに接続可能。
infuraに登録すると、アクセストークンを取得できる。

config.jsというファイルを作っておきtruffle.jsが読み込める場所に置いておき、内容は以下のようにする。

```
module.exports = {
  /*
   * https://infura.io/
   **/
  INFURA_ACCESS_TOKEN: '...',  
   /*
    * RopstenNetのethを持った、MetaMaskのパスフレーズ
    *
    **/
   ROPSTEN_MNEMONIC: '...'
};
```

[truffle-hdwallet-provider](https://github.com/trufflesuite/truffle-hdwallet-provider)を入れる。
truffle-hdwallet-providerとは、mnemonic（ニーモニック）からウォレットを作成し、そのウォレットのアカウントを使ってプログラム上から簡単にトランザクションを発行できる仕組み。

```
$ npm i truffle-hdwallet-provider
```

truffle.jsの内容は以下のよう。
```
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
```

デプロイする。

注意
* gasの値によってうまくいかない時は、gasの数値を増やす
* デプロイでgasは消費される

```
$ truffle migrate --network ropsten
```

以下のように実行結果が返ってくる。

```
Using network 'ropsten'.

Running migration: 1_initial_migration.js
  Deploying Migrations...
  ... 0x9e94723847fa396eeb6b7723128a76deb4cb1821d74396e299994654ef02bbf1
  Migrations: 0xed0b83f554627eaabb27c14cb76aa7f79dd2a400
Saving successful migration to network...
  ... 0x46eb5387023406fcf1735242370258bab955f9cd83f973fd5fb089c79dfc067b
Saving artifacts...

Running migration: 2_deploy_ninjya20.js
  Deploying Ninjya20...
  ... 0x66c5eb879fe051437685b58789377c08a1003958cbce9febe864678a81031187

  Ninjya20: 0x42824c434c8021e4d9cda5bc2a829010a6b5bb0b
Saving successful migration to network...
  ... 0x2445427854ef91dc012501c0bed2f791738d335773fef3ea254a6e43e1085d8b
Saving artifacts...
```

コントラクトのアドレスは0x42824c434c8021e4d9cda5bc2a829010a6b5bb0b
ここから確認できる
* https://ropsten.etherscan.io/token/0x42824c434c8021e4d9cda5bc2a829010a6b5bb0b

自分のアドレスにトークンが付与されたか確認。

* MetaMaskでSENTからTOKENSタブに切り替える
* ADD TOKENをクリック
* 先ほどのコントラクトアドレスを入力
* ADDをクリック

反映されてるのが確認できる。

#### 3.トークン送信できるWEBページを作成

今回はパッケージインストールでnpmの代わりにyarnを使う。
npmとyarnの違いは、[Yarn：Facebook発のパッケージマネジャーはnpmに代わるスタンダードになるか](https://www.webprofessional.jp/yarn-vs-npm/)でわかる。

create-react-appはreact appのテンプレートを作成してくれる。グローバルにyarnでインストール。

```
$ yarn global add create-react-app
```

適当なフォルダで以下を実行。

```
$ create-react-app ninjya20send
```

ninjya20sendフォルダが生成され、内容は以下のように。

```
.
├── .gitignore
├── README.md
├── package.json
├── yarn.lock
├── node_modules
├── public
│   ├── favicon.ico
│   └── index.html
└── src
    ├── App.css
    ├── App.js
    ├── App.test.js
    ├── index.css
    ├── index.js
    ├── logo.svg
    └── registerServiceWorker.js
```

トークン作成時に`$ truffle compile`で生成されたninjya20のbuildフォルダをninjya20sendのsrcフォルダに移す。

srcフォルダにMyToken.jsファイルを生成。内容は以下の通り

```
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
```

src/App.jsの内容を以下のように変更

```
import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import MyToken from './MyToken';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <MyToken />
      </div>
    );
  }
}

export default App;
```

送金ボタンを押すとMetaMaskのUIが立ち上がり送金することができる。

#### 4.ipfs上にて公開

正式名称はInter-Planetary File System。このシステムに保存されたファイルはP2Pネットワーク上に分散されて格納されるため、全ノードが全滅しない限り管理者不在のままシステムが維持され続ける。

一度アップロードされたファイルは完全に削除することはできない。

[go-ipfs](https://dist.ipfs.io/#go-ipfs)からインストール
ダウンロードが完了したらアーカイブを解凍し、インストールスクリプトが存在するディレクトリに移動します。

```
$ cd ~/Downloads/go-ipfs/
```

インストールスクリプトを実行します。ipfsの実行ファイルがusr/local/binに移される。

```
$ sudo ./install.sh
```

バージョン情報が確認できたらインストールに成功しています。

```
$ ipfs version
ipfs version 0.4.14
```

ipfsにcreate-react-appでbuildしたものをアップロードする時、`package.json`に`"homepage": ".",`の一行を加える。これをしないとパスが通らずページが表示されない。

初期化

```
$ ipfs init
```

利用するためにデーモンを立ち上げる

```
$ ipfs daemon
Initializing daemon...
...
API server listening on /ip4/127.0.0.1/tcp/5001
Gateway (readonly) server listening on /ip4/127.0.0.1/tcp/8080
Daemon is ready
```

ローカルのデーモンが起動。これでP2P接続されている状態になり、IPFS上へファイルをアップロードする準備が整う。

ノードの接続状況をGUIで確認が出来るツールも提供されている。

http://localhost:5001/webui

ファイル単体でアップロードするときはipfs add [File name]で実行。

今回はWebサイトをまるごとアップロードしたいので、フォルダを指定して再帰的に追加するオプションで実行。

```
$ ipfs add -r build/
added QmfGCEGjSPG8cHEPXgvdejeghtZbzkUZigUcVQ8LPQnmEe build/asset-manifest.json
added QmcFc6EPhavNSfdjG8byaxxV6KtHZvnDwYXLHvyJQPp3uN build/favicon.ico
added QmXdzDvV2X3SYqg3T5aDPpQpvuy9hXeaMMv2P3PB63frnf build/index.html
added QmPKPhRf2FaxEPeYPa1PebmoLLENgHyq7Sd8UJSSVpnti4 build/manifest.json
added Qmdkv9THpyiai3dC36wFWZ2PCvLG9ywMnGCDyoP4Nwz17Y build/service-worker.js
added QmWhbFnbeHnVPtyH23ipYoEiqJt4no5AK8LFv4YaQyR5kj build/static/css/main.863bde54.css
added QmZb2PaDryeVMNQQc8yUJgpHBPPR6vMN1aTF6QgF7bpzvF build/static/js/main.818943e5.js
added QmT5m9wx8ChkC31Vnx175ShPzMpcB85AS989Hc2dPpsZsZ build/static/media/logo.5d5d9eef.svg
added QmfQ4ZvJqm9iHFiJh7hUAEQoSkY7AeaNkszuuHAwppwmMk build/static/css
added QmW4MtNwaMBCjrhmtzZosH2DeaDT2aPLs26nY9kPChaWKs build/static/js
added QmUCWQYtD8otdHmda45N9svVo67nthP84heyUFydhPPzyK build/static/media
added QmYrvwAj2N1BiU2QaMgNnGdKqbRftXPLKF6nQshxGqSB5j build/static
added QmeEcKokMCuReSjzLUTZP6g6Wbj63xGSAWG6iaBB6bydFH build
```

一番最後のフォルダを示すハッシュ値を使ってWebサイトへアクセスすることが出来る。

ローカルゲートウェイへアクセスする場合は、フォルダのハッシュ値を含めたURLでアクセス。

http://localhost:8080/ipfs/QmeEcKokMCuReSjzLUTZP6g6Wbj63xGSAWG6iaBB6bydFH/

IPFSは https://ipfs.io/ipfs/ハッシュ値 というURLでブラウザからアクセスするサービスも提供してくれている。なので今公開したサイトは以下のURLからも見ることが可能。

https://ipfs.io/ipfs/QmeEcKokMCuReSjzLUTZP6g6Wbj63xGSAWG6iaBB6bydFH/

これがerc20トークンをtruffleを使用し作成 〜 ipfs上にて公開までの一連の流れ。

---

## Reference
* [Ethereum Advent Calendar 2017](https://qiita.com/advent-calendar/2017/ethereum)
* [
truffle-hdwallet-providerの仕組みについて](https://tomokazu-kozuma.com/about-the-mechanism-of-truffle-hdwallet-provider/)