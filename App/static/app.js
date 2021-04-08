$(document).ready(function () {
    LocalHost = "http://localhost:5000"             // '' or http://localhost:5000
    $("#spectrogram").hide();                       // toggle: hide/show
    $('#phraseNumber').val(0);                      // begin number field at 0
    $('#phrase').empty().append("Hello, World.");   // default phrase
    max_val = 1;                                    // default value
    req_getDatasets();

    //Request Functions
    function req_getPhrase() {
        $.ajax({ // Post-Request: Get Phrase from xml file by id and display text string 
            url: (LocalHost + "/Library"),
			type: "POST",
			data: {
				action: "getPhrase", 				// Will forward to getPhrase()
				idDataset: $('#dataset option:selected').text(), 	// Pass value of "Dataset"
				idPhrase: $('#phraseNumber').val()	// Pass value of "Phrase number"
			},
			
			success: function(data) {
				$('#phrase').empty().append(data); // Display new phrase to user
				//console.log(data);
			},
		});
    }

    function req_numPhrase() {
		$.ajax({ //Get total number of phrases in xml library file
            url: (LocalHost + "/Library"),
			type: "POST",
			data: {
				action: "numPhrase", 				// Will forward to getPhrase()
                idDataset: $('#dataset option:selected').text(), 	// Pass value of "Dataset"
			},
			
			success: function(data) {
                max_val = parseInt(data);
			},
		});
    }

    function req_getDatasets() {
        $.ajax({ //Get total number of phrases in xml library file
            url: (LocalHost + "/Library"),
			type: "POST",
			data: {
				action: "getDatasets", 				// Will forward to getPhrase()
			},
			
			success: function(data) {
                var files = data.split(' '); // split string on space

                files.forEach((element, index) => {
                    let option = document.createElement('option');
                    option.value = index;          // Add index to option
                    option.textContent = element;  // Add element HTML
                    $('#dataset').append(option);  // Append option to Dataset (select)
                  });

                console.log("Datasets available: ", files);     //TEST
			},
		});
    }

    //Utility Functions
    function selectPhrase() {
        req_numPhrase();    //Get the total number of phrases in the file

		//Check if phrase # is out of bounds and reset accordingly
        p_num = parseInt($('#phraseNumber').val());
		if (p_num > max_val) {
            $('#phraseNumber').val(1);
		} else if (p_num < 1) {
            $('#phraseNumber').val(max_val);
		}

		req_getPhrase();    // Get the actual text of the phrase selected
	}
    
    function refreshSpectro(){    
        var img = document.getElementById("spectrogram");
        var timestamp = new Date().getTime();   // create a new timestamp 
        var queryStr = "?t=" + timestamp;    // add to image filename

        img.src = "../temp/spectro.png" + queryStr;  // "?---" is discarded
    }

    //On-Input functions
    $(document).on("input", "#phraseNumber", selectPhrase);

    $(document).on("input", "#dataset", function() {
        $('#phraseNumber').val(0);                      // begin number field at 0
        $('#phrase').empty().append("Hello, World.");   // default prompt
        max_val = 1;                                    // default value
        selectPhrase();
        console.log("New phrase library selected.");    //TEST
    });

    
    //"main"
    if (navigator.mediaDevices) {
        var audio = { audio: true };
        var chunks = [];
        var audioBlob = null;
        var clipName = "";

        navigator.mediaDevices.getUserMedia(audio).then(function (stream) {
                var mediaRecorder = new MediaRecorder(stream);	// Init

                // On-Click: "Record"
                $("#record").click(function () {
                    $("#playback").trigger("stop");	// Stop playing preview
                    chunks = [];					// Set chunks empty
                    mediaRecorder.start();			// Start recording

                    //Button updates
                    //$("#spectrogram").hide();                 // toggle: hide/show
                    $("#stop").attr("disabled", false);			//enable
                    $("#grade").attr("disabled", true);			//disable
                    $("#record").attr("disabled", true);		//disable
                });

                // On-Click: "Stop"
                $("#stop").click(function () {
                    mediaRecorder.stop();	// Stop recording

                    $.ajax({ //REQUEST: Store the text prompt in 'sample.txt'
                        url: (LocalHost + "/Store_Phrase"),
                        type: "POST",
                        data: {text: $("#phrase").text() },
                        
                        success: function(data) {
                            console.log(data);     //TEST
                        }
                    });

                    //Button updates
                    $("#record").attr("disabled", false);		//enable
                    $("#grade").attr("disabled", false);		//enable
                    $("#stop").attr("disabled", true);			//disable
                });

                // On-Click: "Grade"
				$("#grade").click(function() {
					$.ajax({ //REQUEST: Pass audio to grading function and get score value (decimal)
                        url: (LocalHost + "/Grade"),
                        type: "POST",
						
						success: function(data) {
                            $('#score').empty().append("Score: ");
							$('#score').append(data);
							$('#score').append("%");

                            console.log(data);     //TEST
						}
					});
				});

                mediaRecorder.onstop = function (e) {
                    clipName = $("#dataset").val() + "_" + $("#phraseNumber").val();
                    audioBlob = new Blob(chunks, { 'type': 'audio/webm; codecs=opus' });
                    chunks = [];
                    var audioURL = URL.createObjectURL(audioBlob);
                    $("#playback").attr("src", audioURL);

                    if ($("#autoplay").is(":checked"))
                        $("#playback").trigger("play");

                    $.ajax({ //REQUEST: Pass audio to grading function and get score value (decimal)
                        url: (LocalHost + "/Store_Audio"),
                        type: "POST",
                        contentType: false,
                        processData: false,
                        data: audioBlob,
                        
                        success: function(data) {
                            refreshSpectro();
                            $("#spectrogram").show();   // toggle: hide/show
                            console.log(data);          //TEST
                        }
                    });
                }

                mediaRecorder.ondataavailable = function (e) {
                    chunks.push(e.data);
                    console.log("New recording: ", e.data);
                }

            })
            .catch(function (err) {
                alert('Error encountered: ' + err);
            })
    }
});