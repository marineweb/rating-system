$.fn.Rating = function(configuration){
    //Internal reference
    var self = this;	
    //Configuration
    self.configuration = configuration;	
	//Star Count
	self.starCount = 5;
	//Document ID
	self.documentId = self.configuration.documentId;	
	//Constructor
	self.constructor = function(){
		//Render Document Rating
		$.ajax({
			"url":"/rating_system_ajax",
			"data":{
				"documentId":self.documentId,
				"action":"extractDocumentReview"
			},
			"success":function(response){

				$("#toggleRatingArea").unbind().click(function(){
					$(self).slideToggle();
				});

				if(response.userCanViewRatingSystem == true){
					self.renderDocumentRating(
						response.rating,
						response.userCanRate,
						response.comments
					);
				}
				else {
					$("#toggleRatingArea").hide();
				}

				$(self).show();
			}
		});		
	};
	//Render Document Rating
	self.renderDocumentRating = function(documentRating,userCanRate,userCanView,documentComments){
		//Clear the deck
		$(self).empty();

		if(!documentRating){
			documentRating = 0;
		}

		if(userCanRate == true){
			//$(self).show();
		}

		var starContainer = $("<div>");
			for(i = 0; i < self.starCount; i++){
				if((i < documentRating) && (userCanRate == false)){
					$(starContainer).append(
						$("<span>").css("color","#fb0").css("font-size","24px").addClass("ratingStar fa fa-star")
					);
				}
				else{
					$(starContainer).append(
						$("<span>").css("color","#fb0").css("font-size","24px").addClass("ratingStar fa fa-star-o")
					);
				}
			}
			
		//Add label
		$(self).append(
			$("<strong>").text("Please Rate Content:")
		);
		$(self).append("</br>");
			
		//Add starContainer to targetElement
		$(self).append(starContainer);
		//Add starContainer to targetElement
		$(self).append(
			$("<div>").attr("id","description").css({
				"width":"100%",
				"font-weight":"bold",
				"font-style":"italic",
				"margin":"8px"
			})
		);

		var starBreakdown = $("<div>").css("margin-top","12px");
			for(i = 1; i <= self.starCount; i++){
				var starRow = $("<div>").addClass("starRow row").attr({
					"identifier":i,
					"votes":0
				});
					//Label
					$(starRow).append(
						$("<div>").addClass("col-md-2").text(i + " Star")
					);
					//Bar Chart
					$(starRow).append(
						$("<div>").addClass("col-md-4").append(
							$("<div>").addClass("progress").append(
								$("<div>").addClass("progress-bar").css("background-color","#fb0").width("1%")
							)
						)
					);
					//Label
					$(starRow).append(
						$("<div>").addClass("col-md-2 starPercentage").text("0%")
					);

				$(starBreakdown).append(starRow);
			}
		//Add ratingComment
		var ratingComment = $("<textarea>").addClass("form-control").hide();
		$(self).append(ratingComment);
		//Submit Button
		var submitReviewButton = $("<div>").addClass("btn btn-success").css("margin-top","4px").hide();
			$(submitReviewButton).append(
				$("<i>").addClass("fa fa-check")
			);
			$(submitReviewButton).append(" Submit Your Review");

		$(self).append(submitReviewButton);

		//Add starBreakdown targetElement
		//$(self).append(starBreakdown);

		//Comments
		if(documentComments){
			$.each(documentComments,function(i,currentComment){
				//Grab the starRow
				var starRow = $(starBreakdown).find(".starRow[identifier='"+ currentComment.rating_number +"']");
				//Grab the currentVotes
				var currentVotes = parseInt($(starRow).attr("votes"));
				//Increase the votes on the $(starRow)
				var totalVotes = (currentVotes + 1);
				$(starRow).attr("votes",totalVotes);
				//Set width of chart
				var votePercentage = ((totalVotes / documentComments.length) * 100);

				if(!votePercentage){
					votePercentage = 0;
				}
				$(starRow).find(".progress-bar").width(votePercentage + "%");
				$(starRow).find(".starPercentage").text(votePercentage + "%");
				var commentContainer = $("<div>").addClass("well").css("width","100%");
					$(commentContainer).append(
						$("<em>").html("&quot;" + currentComment.rating_comment + "&quot;").css({
							"width":"100%",
							"font-size":"15px",
							"margin-bottom":"4px"
						})
					);
					$(commentContainer).append(
						$("<div>").text(currentComment.first_name + " " + currentComment.last_name).css({
							"width":"100%",
							"font-weight":"bold"
						})
					);
					$(commentContainer).append(
						$("<div>").text(currentComment.rating_date).css({
							"width":"100%",
							"margin-top":"8px"
						})
					);
				$(self).append(commentContainer);
			});
		}
		//User Can Rate
		if(userCanRate == true){
			//.fadeIn() the $(ratingComment) textarea
			$(ratingComment).fadeIn();
			//.fadeIn() the $(submitReviewButton)
			$(submitReviewButton).fadeIn();

			//Bind submitReviewButton click event
			$(submitReviewButton).click(function(){
				if($(self).find(".fa-star").length < 1){
					alert("Please provide a rating");
				}
				else if($(ratingComment).val().length > 0){
					$.ajax({
						"url":"/rating_system_ajax",
						"data":{
							"action":"submitReview",
							"documentId":self.documentId,
							"ratingComment":$(ratingComment).val(),
							"ratingNumber":$(self).find(".fa-star").length
						},
						"success":function(response){
							try{
								Intercom("trackEvent","rated-content:" + self.documentId);
							}
							catch(e){
								console.log("Oh dearie me. It appears Intercom is not available.");
							}

							self.constructor();
						}
					});
				}
				else{
					alert("Please provide a comment");
				}
			});
			//Bind .ratingStar events
			$(starContainer).find(".ratingStar").click(function(){
				//Toggle fa-star and fa-star-o
				if($(this).hasClass("fa-star-o")){
					$(this).removeClass("fa-star-o").addClass("fa-star");
					//Remove all lowerSiblings' stars
					$(this).prevAll().removeClass("fa-star-o").addClass("fa-star");
				}
				else{
					$(this).removeClass("fa-star").addClass("fa-star-o");
					//Update all higherSiblings' stars
					$(this).nextAll().removeClass("fa-star").addClass("fa-star-o");
				}
				//Render Rating Descriptions
				self.renderRatingDescriptions();
			});
		}
		//Render Rating Descriptions
		self.renderRatingDescriptions();
	};
	//Render Rating Descriptions
	self.renderRatingDescriptions = function(){
		//Counter and description
		var starDescription = "";
		var totalStars = $(self).find(".fa-star").length;
		if(totalStars == 1){
			starDescription = "Terrible";
		}
		if(totalStars == 2){
			starDescription = "Pretty Bad";
		}
		if(totalStars == 3){
			starDescription = "Okay";
		}
		if(totalStars == 4){
			starDescription = "Pretty Good";
		}
		if(totalStars == 5){
			starDescription = "Awesome";
		}

		$(self).find("#description").text(starDescription);
	};	
	//Showtime
	$(document).ready(self.constructor);
	//Send back the internal reference
	return self;
};