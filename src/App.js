import './App.css';
import { useState } from 'react';
import { Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';
import {
  Program, AnchorProvider, web3
} from '@project-serum/anchor';

import idl from './idl.json';

import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
require('@solana/wallet-adapter-react-ui/styles.css');

const network = clusterApiUrl('devnet');

const wallets = [ new PhantomWalletAdapter()]
const { SystemProgram } = web3;

const baseAccount = web3.Keypair.generate();
const opts = {
  preflightCommitment:"processed"
}

const programID = new PublicKey(idl.metadata.address)

function App() {
  const [value, setValue] = useState('');
  const [dataList,setDataList] = useState([]);
  const [input,setInput] = useState('');
  const wallet = useWallet();

  async function getProvider() {
    /* create the provider and return it to the caller */
    /* network set to local network for now */
    //const network = "http://127.0.0.1:8899";
    //const network = "https://api.devnet.solana.com";
    const connection = new Connection(network, opts.preflightCommitment);

    const provider = new AnchorProvider(
      connection, wallet, opts.preflightCommitment,
    );
    return provider;
  }

  async function initialize() {
    const provider = await getProvider();
    const program = new Program(idl,programID,provider);
    try {
      await program.rpc.initialize("Hello world", {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers:[baseAccount],
      });

      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      console.log('account: ',account);
      setValue(account.data.toString());
      setDataList(account.dataList);
    }catch(err) {
        console.log("Transaction error: ",err);
    }
  }

  async function update() {
    if (!input) return
    const provider = await getProvider();
    const program = new Program(idl,programID,provider);
    try {
      await program.rpc.update(input,{
        accounts:{
          baseAccount:baseAccount.publicKey,
        }
      });
    }catch(err) {
      console.log("update err:",err);
    };

    const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    console.log("update:", account);
    setValue(account.data.toString());
    setDataList(account.dataList);
    setInput(''); 
  }
  
  if (!wallet.connected) {
    /* If the user's wallet is not connected, display connect wallet button. */
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop:'100px' }}>
        <WalletMultiButton />
      </div>
    )
  } else {
    return (
      <div className="App">
        <div>
          {
            !value && (<button onClick={initialize}>initialize</button>)
          }
          {
            value? (
              <div>
                <h2>Current value: {value}</h2>
                <input placeholder='Add new data'
                  onChange={e=>setInput(e.target.value)}
                  value = {input}
                />
                <button onClick={update}>Add data</button>
              </div>
             ) : (
              <h3>Please initialize.</h3>
            )
          }

          {
            dataList.map((val,i)=><h4 key={i}>{val}</h4>)
          }
        </div>
      </div>
    );
  }
}

/* wallet configuration as specified here: https://github.com/solana-labs/wallet-adapter#setup */
const AppWithProvider = () => (
  <ConnectionProvider endpoint={network}>
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
)

export default AppWithProvider;