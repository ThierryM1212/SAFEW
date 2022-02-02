import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { confirmAlert, errorAlert } from '../utils/Alerts';
import { addWallet, getWalletNames, updateWallet } from '../utils/walletUtils';

export default function Dropzone(props) {
  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader()

      reader.onabort = () => console.log('file reading was aborted')
      reader.onerror = () => console.log('file reading has failed')
      reader.onload = () => {
        // Do whatever you want with the file contents
        const binaryStr = reader.result
        console.log(binaryStr)
        var enc = new TextDecoder("utf-8");
        const json = JSON.parse(enc.decode(binaryStr));

        if ("walletList" in json) {
          confirmAlert("Restore SAFEW backup ?",
            "The current wallets will be lost and replaced by the backup",
            "OK")
            
            .then(res => {
              if (res.isConfirmed) {
                localStorage.setItem('walletList', json.walletList);
                props.setPage('home');
              }
            })
        } else {
          if ("name" in json && "mnemonic" in json) {
            const walletIndex = getWalletNames().indexOf(json.name);
            var msg = '';
            if (walletIndex > -1) {
              msg = "The current wallet " + json.name + " will be replaced by the imported one."
            }
            confirmAlert("Restore " + json.name + " backup ?",
              msg,
              "OK")
              .then(res => {
                if (res.isConfirmed) {
                  if (walletIndex > -1) {
                    updateWallet(json, walletIndex);
                  } else {
                    addWallet(json);
                  }
                  props.setPage('home');
                }
              })
          } else {
            errorAlert("Invalid file");
          }
        }
      }
      reader.readAsArrayBuffer(file)
    })

  }, [])
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: '.json'
  })

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <p className="btn-outline-info dropzone btn">
        Restore backup or wallet<br />
        Drop here
      </p>

    </div>
  )
}