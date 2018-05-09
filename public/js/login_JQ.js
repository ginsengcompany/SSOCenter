$(document).ready(function() {

    sessionStorage.clear();

    $('.oklogin').keypress(function (e) {
        if (e.which == 13) {
            sottoMettiForm();
        }
    });

});

function sottoMettiForm() {

    var username = $("#username").val();
    var password = $("#password").val();

    if ((username == "") && (password == "")) {

        alert("ATTENZIONE DIGITARE LE CREDENZIALI DI ACCESSO");

        return false;
    }
    if (username == "") {

        alert("ATTENZIONE DIGITARE LA USER");

        return false;
    }

    if (password == "") {

        alert("ATTENZIONE DIGITARE LA PASSWORD");

        return false;
    }

    var dataser = $("#formLogin").serializeArray();

    $.get("wh-api/logins/getuid",

        dataser,

        function(data) {

            var uidesterno = "";

            $.each(data, function (index, item) {

                uidesterno = item.UTENTEID;
            });

            if (!uidesterno) {

                alert("ACCESSO NEGATO !");

                return false;
            }

            $.ajax({

                type: "get",

                url: "wirgilio-api/utentis/accounts/" + uidesterno,

                success: function(data) {


                    var strLogin = {
                        "username"      : data.utenteid,
                        "cognome"       : data.utentecognome,
                        "nome"          : data.utentenome,
                        "codicefiscale" : data.utentecodicefiscale,
                        "codprofilo"    : data.profili[0].utentecodiceprofilo,
                        "desprofilo"    : data.profili[0].utentedescrizioneprofilo,
                        "codstruttura"  : data.utentecodicestruttura,
                        "desstruttura"  : data.utentedescrizionestruttura,
                        "nominativo"    : data.utentenome + ' ' + data.utentecognome,
                        "idpaziente"    : data.idpaziente,
                        "ordinemedici"  : data.utenteordinemedici,
                        "matricola"     : data.utentematricola,
                        "firmaimage"    : data.utentefirmaimage,
                        "codpresidio"   : data.utentecodicepresidio,
                        "titolo"        : data.utentetitolo
                    };


                    if (!data) {

                        alert("Attenzione Utente non censito, controllare le credenziali di accesso!");
                    }
                    else {

                        if (data.profili.length < 1) {

                            alert("Attenzione Utente senza nessun Profilo associato");
                        }
                        else if (!data.utentecodicestruttura) {

                            alert("Attenzione Utente senza nessuna Struttura associata. Contattare l'amministratore!");
                        }
                        else if (!data.utentecognome || !data.utentenome) {

                            alert("Attenzione Utente senza Cognome o Nome valido. Contattare l'amministratore!");
                        }
                        else {

                            if(data.profili.length > 1) {
                                sessionStorage.setItem('idutente', data.utenteid);
                            }else{
                                sessionStorage.setItem('utente', JSON.stringify(strLogin));
                            }

                            /*Prima -----------------------
                            sessionStorage.setItem('utente', JSON.stringify(strLogin));

                            /*if(data.idpaziente){
                                $(location).attr('href','home.shtml');
                            }else{
                               //$(location).attr('href','pannellohome.shtml');
                               $(location).attr('href','home.shtml');
                            }
                            ---------------------------------------*/
                        }
                    }
                },
                complete: function() {

                    if (sessionStorage.getItem("idutente")){
                        $(location).attr('href','welcome.html');
                    }else if (sessionStorage.getItem("utente")){
                        $(location).attr('href','home.shtml');
                    }

                    /*Prima -----------------------
                    if(sessionStorage.getItem("utente")){
                    $(location).attr('href','home.shtml');
                    //$(location).attr('href','pannellohome.shtml');
                    }
                    ------------------------------*/
                },
                error: function() {

                    alert("Errore Login!");
                }

            });

        },

        'json'
    )
        .done(function(data, status) {

        })
        .fail(function(xhr, status, e) {

        })
        .always(function() {

        });

}