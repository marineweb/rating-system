<?php	
	global $AI;
	//Ajax Handler
	class _ajaxHandler{	  
		//Constructor
		function __construct($requestData){
			//Permissions
			$this->perm = new c_permissions('libdoc');
			
			//$this->perm->get('rate_content')			
			//JSON Response
			$this->jsonResponse = array();
			//Try to run the $requestData["action"]
			if(in_array($requestData["action"],get_class_methods($this))){
				//Try to run the function
				$this->$requestData["action"]($requestData);
			}
		}
		//
		function submitReview($requestData){
			global $AI;
			//Query
			$this->jsonResponse["status"] = $AI->db->query("
				INSERT INTO  ai_review(
					user_id,
					document_id,
					rating_number,
					rating_comment
				)
				VALUES (
					'".db_in($AI->user->userID)."',
					'".db_in($requestData["documentId"])."',
					'".db_in($requestData["ratingNumber"])."',
					'".db_in($requestData["ratingComment"])."'
				);
			");			
		}
		//Extract Document Rating
		function extractDocumentReview($requestData){
			global $AI;
			/*
			I hid the rating system since it's not supposed to show to regular users and needs a couple updates (just added a display:none to the container in view mode is all			
			*/
			
			if($this->perm->get('rate_content')){
				//Query
				$this->jsonResponse["rating"] = @end(db_fetch_assoc($AI->db->query("
					SELECT 	CEILING(SUM(ai_review.rating_number) / COUNT(ai_review.id))		
					FROM 	ai_review
					WHERE	ai_review.document_id = '".db_in($requestData["documentId"])."'
				")));

				$this->jsonResponse["comments"] = array();
				$commentsQuery = $AI->db->query("
					SELECT 	ai_review.rating_date,
							ai_review.rating_comment,
							ai_review.rating_number,
							users.first_name,
							users.last_name
					FROM 	ai_review
					JOIN	users
					  ON	(users.userID = ai_review.user_id)
					WHERE	ai_review.document_id = '".db_in($requestData["documentId"])."'
				");
				//Loop
				while($currentComment = db_fetch_assoc($commentsQuery)){
					$currentComment["rating_date"] = date("F j, H:i", strtotime($currentComment["rating_date"]));
					$this->jsonResponse["comments"][] = $currentComment;
				}			
				
				$userRateCheck = @end(db_fetch_assoc($AI->db->query("
					SELECT 	ai_review.id
					FROM 	ai_review
					WHERE	ai_review.document_id = '".db_in($requestData["documentId"])."'
					AND		ai_review.user_id = '".db_in($AI->user->userID)."'
				")));
				
				if($this->perm->get('rate_content') == false){
					$userRateCheck = false;
				}
				
				$this->jsonResponse["userCanRate"] = $userRateCheck ? false : true;	
				
				if($AI->user->account_type == "Contributor"){
					$this->jsonResponse["userCanViewRatingSystem"] = false;	
				}				
				else{
					$this->jsonResponse["userCanViewRatingSystem"] = true;
				}
			}
		}	
		//Send JSON Response
		function __destruct(){
			//Send JSON content type header
			header("Content-type:application/json");
			//Do the thing!
			die(json_encode($this->jsonResponse));
		}		
	}
	//Showtime
	$ratingSystemAjax = new _ajaxHandler($_REQUEST);	
?>