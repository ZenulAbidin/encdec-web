/* global bootstrap: false */

(() => {
  'use strict'

  // Tooltip and popover demos
  document.querySelectorAll('.tooltip-demo')
    .forEach(tooltip => {
      new bootstrap.Tooltip(tooltip, {
        selector: '[data-bs-toggle="tooltip"]'
      })
    })

  document.querySelectorAll('[data-bs-toggle="popover"]')
    .forEach(popover => {
      new bootstrap.Popover(popover)
    })

  document.querySelectorAll('.toast')
    .forEach(toastNode => {
      const toast = new bootstrap.Toast(toastNode, {
        autohide: false
      })

      toast.show()
    })

  // Disable empty links and submit buttons
  document.querySelectorAll('[href="#"], [type="submit"]')
    .forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault()
      })
    })

  function setActiveItem() {
    const { hash } = window.location

    if (hash === '') {
      return
    }

    const link = document.querySelector(`.bd-aside a[href="${hash}"]`)

    if (!link) {
      return
    }

    const active = document.querySelector('.bd-aside .active')
    const parent = link.parentNode.parentNode.previousElementSibling

    link.classList.add('active')

    if (parent.classList.contains('collapsed')) {
      parent.click()
    }

    if (!active) {
      return
    }

    const expanded = active.parentNode.parentNode.previousElementSibling

    active.classList.remove('active')

    if (expanded && parent !== expanded) {
      expanded.click()
    }
  }

  setActiveItem()
  window.addEventListener('hashchange', setActiveItem)
})()

const alertPlaceholder = document.getElementById('liveAlertPlaceholder')
const appendAlert = (message, type) => {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = [
    `<div class="alert alert-${type} alert-dismissible" role="alert">`,
    `   <div>${message}</div>`,
    '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
    '</div>'
  ].join('')

  alertPlaceholder.append(wrapper)
}

async function encryptText(plainText, password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const passwordData = encoder.encode(password);

  const salt = self.crypto.getRandomValues(new Uint8Array(16));

  const key = await self.crypto.subtle.importKey('raw', passwordData, { name: 'PBKDF2' }, false, ['deriveKey']);
  const derivedKey = await self.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
    key,
    { name: 'AES-CBC', length: 256 },
    true,
    ['encrypt']
  );

  const iv = self.crypto.getRandomValues(new Uint8Array(16));

  const encryptedData = await self.crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    derivedKey,
    data
  );

  const encryptedArray = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
  encryptedArray.set(salt, 0);
  encryptedArray.set(iv, salt.length);
  encryptedArray.set(new Uint8Array(encryptedData), salt.length + iv.length);

  return btoa(String.fromCharCode.apply(null, encryptedArray));
}


async function decryptText(encryptedText, password) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  try {
    const encryptedArray = new Uint8Array(atob(encryptedText).split('').map(char => char.charCodeAt(0)));

    const salt = encryptedArray.slice(0, 16);
    const iv = encryptedArray.slice(16, 32);
    const encryptedData = encryptedArray.slice(32);

    const passwordData = encoder.encode(password);

    try {
      const key = await self.crypto.subtle.importKey('raw', passwordData, { name: 'PBKDF2' }, false, ['deriveKey']);
      const derivedKey = await self.crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
        key,
        { name: 'AES-CBC', length: 256 },
        true,
        ['decrypt']
      );

      const decryptedData = await self.crypto.subtle.decrypt(
        { name: 'AES-CBC', iv },
        derivedKey,
        encryptedData
      );

      return decoder.decode(decryptedData);
    } catch (error) {
      appendAlert('Incorrect decryption password', 'danger');
      return null;
    }
  } catch (error) {
    appendAlert('Invalid Base64 input', 'danger');
  }
}

document.getElementById('encryptButton').addEventListener('click', async function() {
  const text = document.getElementById('text').value;
  const password = document.getElementById('password').value;

  const encryptedText = await encryptText(text, password);
  document.getElementById('result').textContent = encryptedText;
});

document.getElementById('decryptButton').addEventListener('click', async function() {
  const text = document.getElementById('text').value;
  const password = document.getElementById('password').value;

  const decryptedText = await decryptText(text, password);
  document.getElementById('result').textContent = decryptedText;
});


document.getElementById('copyButton').addEventListener('click', function() {
  const resultText = document.getElementById('result');
  const textToCopy = resultText.textContent;
  
  const tempTextArea = document.createElement('textarea');
  tempTextArea.value = textToCopy;
  document.body.appendChild(tempTextArea);
  tempTextArea.select();
  navigator.clipboard.writeText(textToCopy).then(function() {
    appendAlert('Text copied to clipboard', 'success');
  })
  document.body.removeChild(tempTextArea);
});
