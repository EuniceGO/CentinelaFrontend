import axios from 'axios';
import storage from './Storage/storage.jsx';
import Swal from 'sweetalert2';

export const showAlert = (icon, msj) => {
    Swal.fire({
        icon: icon,
        title: msj,
        buttonsStyling: true
    });
}

export const sendRequest =  async (method, params, url, redir='',token=true) => {
    if(token){
        const authToken = storage.get('authToken');
        axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    }
    let res;
    await axios({method: method, url: url, data: params}).then(
        response => {
            res = response.data,
            (method !='GET') ? showAlert(response.data.status, response.data.message, 'success') : ''
            //Tiempo de espera para redireccionar
            setTimeout(() =>  (redir != '') ? window.location.href = redir : '' , 2000);
        }).catch( (error) => {
            let desc='';
            res = error.response.data;
            res.response.data.errors.map( (e) => {desc = desc + '' + e});
            showAlert('error', desc);
        }

    );
    return res;
};

export const confirmation = async (name, url , redir) => {
    const alert = Swal.mixin({buttonsStyling: true,});
    alert.fire({
        title: 'Are you sure?',
        text: `You are about to delete ${name}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'

    }).then( async (result) => {
        if (result.isConfirmed) {
            await sendRequest('DELETE', {}, url, redir);
        }
    });
}

export default showAlert;