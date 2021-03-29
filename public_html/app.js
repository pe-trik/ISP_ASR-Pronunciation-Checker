reqRUL_Library = "http://localhost:5000/Library";    //Local
reqRUL_Grade = "http://localhost:5000/Grade";    //Local
//reqURL = "Action", "Grade";    //Cluster

$(document).ready(function () {
    $('#phraseNumber').val(0);                      // begin number field at 0
    $('#phrase').empty().append("Hello, World.");   // default prompt
    max_val = 1;                                    // default value
    req_getDatasets();

    //Request Functions
    function req_getPhrase() {
        $.ajax({ // Post-Request: Get Phrase from xml file by id and display text string 
			type: "POST",
			data: {
				action: "getPhrase", 				// Will forward to getPhrase()
				idDataset: $('#dataset option:selected').text(), 	// Pass value of "Dataset"
				idPhrase: $('#phraseNumber').val()	// Pass value of "Phrase number"
			},
            url: reqRUL_Library,
			
			success: function(data) {
				$('#phrase').empty().append(data); // Display new phrase to user
				//console.log(data);
			},
		});
    }

    function req_numPhrase() {
		$.ajax({ //Get total number of phrases in xml library file
			type: "POST",
			data: {
				action: "numPhrase", 				// Will forward to getPhrase()
                idDataset: $('#dataset option:selected').text(), 	// Pass value of "Dataset"
			},
            url: reqRUL_Library,
			
			success: function(data) {
                max_val = parseInt(data);
                //console.log("# of phrases in this library: " + max_val);    //TEST
			},
		});
    }

    function req_getDatasets() {
        $.ajax({ //Get total number of phrases in xml library file
			type: "POST",
			data: {
				action: "getDatasets", 				// Will forward to getPhrase()
			},
            url: reqRUL_Library,
			
			success: function(data) {
                var files = data.split(' '); // split string on space

                files.forEach((element, index) => {
                    let option = document.createElement('option');
                    option.value = index;          // Add index to option
                    option.textContent = element;  // Add element HTML
                    $('#dataset').append(option);  // Append option to Dataset (select)
                  });

                console.log(files);     //TEST
			},
		});
    }

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
	}//selectPhrase()
        
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
                    $("#stop").attr("disabled", false);			//enable
                    $("#grade").attr("disabled", true);			//disable
                    $("#record").attr("disabled", true);		//disable
                });

                // On-Click: "Stop"
                $("#stop").click(function () {
                    mediaRecorder.stop();	// Stop recording

                    //Button updates
                    $("#record").attr("disabled", false);		//enable
                    $("#grade").attr("disabled", false);		//enable
                    $("#stop").attr("disabled", true);			//disable
                });

                // On-Click: "Grade"
				$("#grade").click(function() {
					//var form = new FormData();
					//form.append('audio', audioBlob);

					$.ajax({ //REQUEST: Pass audio to grading function and get score value (decimal)
						url: reqRUL_Grade,
                        type: "POST",
                        contentType: false,
                        processData: false,
                        //dataType: 'audiodata',
                        data: audioBlob,
						
						success: function(data) {
							$('#score').empty().append(data);
							$('#score').append("%");
							console.log(data);     //TEST
                            //console.log(audioBlob.chunks);
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
                }

                mediaRecorder.ondataavailable = function (e) {
                    chunks.push(e.data);
                    console.log(e.data);
                }

            })
            .catch(function (err) {
                alert('Error encountered: ' + err);
            })
    }
});
