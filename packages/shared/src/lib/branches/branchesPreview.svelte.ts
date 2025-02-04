import { branchesSelectors } from '$lib/branches/branchesSlice';
import { BranchStatus, type Branch, type LoadableBranch } from '$lib/branches/types';
import { registerInterest, type InView } from '$lib/interest/registerInterestFunction.svelte';
import { isFound } from '$lib/network/loadable';
import { gravatarUrlFromEmail } from '@gitbutler/ui/avatar/gravatar';
import type { BranchService } from '$lib/branches/branchService';
import type { AppBranchesState } from '$lib/redux/store.svelte';
import type { Reactive } from '$lib/storeUtils';

export function getBranchReviews(
	appState: AppBranchesState,
	branchService: BranchService,
	repositoryId: string,
	status: BranchStatus = BranchStatus.All,
	inView?: InView
): Reactive<LoadableBranch[]> {
	const branchReviewsInterest = branchService.getBranchesInterest(repositoryId, status);
	registerInterest(branchReviewsInterest, inView);

	const branchReviews = $derived(
		branchesSelectors
			.selectAll(appState.branches)
			.filter((branch) => isFound(branch) && branch.value.repositoryId === repositoryId)
	);

	console.log(branchReviews);

	return {
		get current() {
			return branchReviews;
		}
	};
}

export function getBranchReview(
	appState: AppBranchesState,
	branchService: BranchService,
	repositoryId: string,
	branchId: string,
	inView?: InView
): Reactive<LoadableBranch | undefined> {
	const branchReviewInterest = branchService.getBranchInterest(repositoryId, branchId);
	registerInterest(branchReviewInterest, inView);

	const branchReview = $derived(branchesSelectors.selectById(appState.branches, branchId));

	return {
		get current() {
			return branchReview;
		}
	};
}

export async function getContributorsWithAvatars(branch: Branch) {
	return await Promise.all(
		branch.contributors.map(async (contributor) => {
			return {
				srcUrl: await gravatarUrlFromEmail(contributor),
				name: contributor
			};
		})
	);
}
