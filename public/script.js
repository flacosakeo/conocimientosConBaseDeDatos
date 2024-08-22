document.getElementById('mostrar-datos-btn').addEventListener('click', function(event) {
    event.preventDefault(); // Evita el comportamiento predeterminado del enlace

    fetch('/mostrar-datos')
        .then(response => response.json())
        .then(dataArray => {
            skillCirculo(dataArray);
        })
        .catch(error => console.error('Error fetching data:', error));
});

document.getElementById('submit-form-btn').addEventListener('click', function(event) {
    porcentaje = parseInt(document.getElementById('porcentaje').value);
    event.preventDefault(); // Evita el comportamiento predeterminado del formulario
    if (document.getElementById('nombre').value.trim() == ''){
        alert("Ingrese un nombre")
    }else{
        if (porcentaje <= 100 && porcentaje >= 1){
            const formData = new FormData(document.getElementById('form-id'));
            
            const nombre = formData.get('nombre');
            const porcentaje = formData.get('porcentaje');

            fetch('/submit-form', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `nombre=${encodeURIComponent(nombre)}&porcentaje=${encodeURIComponent(porcentaje)}`
            })
            .then(response => {
                if (response.ok) {
                    return response.text(); // Si la respuesta es correcta, obtenemos el texto de respuesta
                } else if (response.status === 400) {
                    return response.text().then(text => { throw new Error(text); });
                } else {
                    throw new Error('Error al enviar el formulario');
                }
            })
            .then(text => {
                alert('Conocimiento y porcentaje guardados correctamente');
                document.getElementById('modalForm').style.display = 'none;'
                // Después de guardar, obtener y mostrar los datos actualizados
                fetch('/mostrar-datos')
                    .then(response => response.json())
                    .then(dataArray => {
                        skillCirculo(dataArray);
                    })
                    .catch(error => console.error('Error fetching data:', error));
            })
            .catch(error => {
                alert(error.message); // Mostrar el error en un alert si el conocimiento ya existe
            });
        }else{
            alert("El valor debe ser entre 1 y 100");
        }
    }
});

document.getElementById('cargar').addEventListener('click', () => {
    document.getElementById('modalForm').style.display = 'block';
    document.querySelector('#close').onclick = function() {
        document.getElementById('modalForm').style.display = 'none';
    };
})

// Función para abrir el modal con los datos
function openModal(id, nombre, porcentaje) {
    document.getElementById('modal-title').value = nombre;
    document.getElementById('modal-porcentaje').value = porcentaje;

    // Mostrar el modal
    const modal = document.getElementById('modal');
    modal.style.display = 'block';

    // Configurar el botón de cerrar
    document.querySelector('#closeModify').onclick = function() {
        modal.style.display = 'none';
    };

    // Configurar el botón de modificar
    // Guardar los cambios cuando se haga clic en "Guardar cambios"
    document.getElementById('edit-btn').onclick = function() {
        const nuevoNombre = document.getElementById('modal-title').value;
        const nuevoPorcentaje = document.getElementById('modal-porcentaje').value;

        if (nuevoNombre.trim() === '') {
            alert('El nombre no puede estar vacío.');
            return;
        }

        if (nuevoPorcentaje < 1 || nuevoPorcentaje > 100) {
            alert('El porcentaje debe estar entre 1 y 100.');
            return;
        }

        // Enviar solicitud PUT al servidor para actualizar el conocimiento
        fetch(`/modificar-conocimiento`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, nombre: nuevoNombre, porcentaje: nuevoPorcentaje })
        })
        .then(response => {
            if (response.ok) {
                alert(`${nuevoNombre} ha sido modificado.`);
                modal.style.display = 'none';
                // Recargar los datos para reflejar la modificación
                fetch('/mostrar-datos')
                .then(response => response.json())
                .then(dataArray => {
                    skillCirculo(dataArray);
                })
                .catch(error => console.error('Error fetching data:', error));
            } else {
                return response.text().then(text => { throw new Error(text); });
            }
        })
        .catch(error => {
            alert(`Error: ${error.message}`);
        });
    };

    // Configurar el botón de eliminar
    document.getElementById('delete-btn').onclick = function() {
        if (confirm(`¿Estás seguro de que deseas eliminar ${nombre}? con ID: ${id}`)) {
            // Enviar solicitud DELETE al servidor
            //console.log(id)
            fetch('/eliminar-conocimiento', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id })
            })
            .then(response => {
                if (response.ok) {
                    //alert(`${nombre} ha sido eliminado.`);
                    modal.style.display = 'none';
                    // Recargar los datos para reflejar la eliminación
                    fetch('/mostrar-datos')
                    .then(response => response.json())
                    .then(dataArray => {
                        skillCirculo(dataArray);
                    })
                    .catch(error => console.error('Error fetching data:', error));
                } else {
                    return response.text().then(text => { throw new Error(text); });
                }
            })
            .catch(error => {
                alert(`Error: ${error.message}`);
            });
        }
    };
}


// Cerrar el modal si se hace clic fuera de él
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    const modalCarga = document.getElementById('modalForm');
    if (event.target === modal || event.target === modalCarga) {
        modal.style.display = 'none';
        modalCarga.style.display = 'none';
    }
};
