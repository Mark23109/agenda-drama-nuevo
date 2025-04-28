import { getFirestore, collection, addDoc, getDocs, orderBy, deleteDoc, doc, onSnapshot, Timestamp, query } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';

document.addEventListener('DOMContentLoaded', () => {
    const nombreInput = document.getElementById('nombre');
    const motivoInput = document.getElementById('motivo');
    const fechaInput = document.getElementById('fecha');
    const agendarBtn = document.getElementById('agendarBtn');
    const listaDramas = document.getElementById('listaDramas');

    // Obtén la instancia de la aplicación Firebase (ya inicializada en index.html)
    const app = getApp();
    // Obtén la instancia de Firestore
    const db = getFirestore(app);
    const dramasCollection = collection(db, 'dramas');

const renderizarDramas = (dramasData) => {
    console.log("Datos recibidos en renderizarDramas:", dramasData);
    listaDramas.innerHTML = '';
    dramasData.forEach(drama => { // Iteramos directamente sobre el array de objetos drama
        console.log("Elemento 'drama' en renderizarDramas:", drama);
        if (drama && drama.id && drama.nombre && drama.motivo && drama.fecha) {
            const fechaFirestore = drama.fecha;
            const fechaLocal = fechaFirestore ? new Date(fechaFirestore.seconds * 1000 + fechaFirestore.nanoseconds / 1000000).toLocaleString() : 'Fecha no disponible';
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span><strong>${drama.nombre}:</strong> ${drama.motivo} (${fechaLocal})</span>
                <button class="eliminar-btn" data-id="${drama.id}">Eliminar</button>
            `;
            listaDramas.appendChild(listItem);
        } else {
            console.error("Error: Elemento 'drama' inválido en renderizarDramas:", drama);
        }
    });

    const botonesEliminar = document.querySelectorAll('.eliminar-btn');
    botonesEliminar.forEach(boton => {
        boton.addEventListener('click', function() {
            const idDramaAEliminar = this.dataset.id;
            eliminarDrama(idDramaAEliminar);
        });
    });
};

    const obtenerDramas = () => {
        const q = query(dramasCollection, orderBy('fecha'));
        getDocs(q).then((querySnapshot) => {
            const dramasFirestore = [];
            querySnapshot.forEach((doc) => {
                dramasFirestore.push({ id: doc.id, ...doc.data() });
            });
            console.log("Dramas Firestore (obtenerDramas):", dramasFirestore);
            renderizarDramas(dramasFirestore);
        });
    };

    agendarBtn.addEventListener('click', () => {
        const nombre = nombreInput.value.trim();
        const motivo = motivoInput.value.trim();
        const fecha = fechaInput.value;

        if (nombre && motivo && fecha) {
            addDoc(dramasCollection, {
                nombre,
                motivo,
                fecha: Timestamp.fromDate(new Date(fecha))
            })
            .then(() => {
                console.log("Drama agendado con éxito!");
                nombreInput.value = '';
                motivoInput.value = '';
                fechaInput.value = '';
                obtenerDramas();
            })
            .catch((error) => {
                console.error("Error al agendar el drama: ", error);
                alert("Hubo un error al agendar el drama.");
            });
        } else {
            alert('Por favor, completa todos los campos.');
        }
    });

    const eliminarDrama = (idDrama) => {
        deleteDoc(doc(dramasCollection, idDrama))
            .then(() => {
                console.log("Drama eliminado con éxito!");
                obtenerDramas();
            })
            .catch((error) => {
                console.error("Error al eliminar el drama: ", error);
                alert("Hubo un error al eliminar el drama.");
            });
    };

    obtenerDramas();

    onSnapshot(query(dramasCollection, orderBy('fecha')), (snapshot) => {
        console.log("Snapshot recibido:", snapshot);
        const dramasFirestore = [];
        snapshot.forEach((doc) => {
            console.log("Documento en snapshot:", doc);
            dramasFirestore.push({ id: doc.id, ...doc.data() });
        });
        console.log("Dramas Firestore (onSnapshot) antes de renderizar:", dramasFirestore);
        renderizarDramas(dramasFirestore.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
    });
});