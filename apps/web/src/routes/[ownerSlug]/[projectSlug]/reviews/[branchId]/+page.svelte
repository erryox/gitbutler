<script lang="ts">
	import Factoid from '$lib/components/Factoid.svelte';
	import ChangeIndexCard from '$lib/components/changes/ChangeIndexCard.svelte';
	import { projectReviewBranchCommitPath, type ProjectReviewParameters } from '$lib/routing';
	import { BranchService } from '@gitbutler/shared/branches/branchService';
	import {
		getBranchReview,
		getContributorsWithAvatars
	} from '@gitbutler/shared/branches/branchesPreview.svelte';
	import { getContext } from '@gitbutler/shared/context';
	import Loading from '@gitbutler/shared/network/Loading.svelte';
	import { isFound, and } from '@gitbutler/shared/network/loadable';
	import { lookupProject } from '@gitbutler/shared/organizations/repositoryIdLookupPreview.svelte';
	import { RepositoryIdLookupService } from '@gitbutler/shared/organizations/repositoryIdLookupService';
	import { AppState } from '@gitbutler/shared/redux/store.svelte';
	import Badge from '@gitbutler/ui/Badge.svelte';
	import Button from '@gitbutler/ui/Button.svelte';
	import LinkButton from '@gitbutler/ui/LinkButton.svelte';
	import AvatarGroup from '@gitbutler/ui/avatar/AvatarGroup.svelte';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import type { Branch } from '@gitbutler/shared/branches/types';
	import { goto } from '$app/navigation';

	dayjs.extend(relativeTime);

	interface Props {
		data: ProjectReviewParameters;
	}

	let { data }: Props = $props();

	const repositoryIdLookupService = getContext(RepositoryIdLookupService);
	const branchService = getContext(BranchService);
	const appState = getContext(AppState);

	const repositoryId = $derived(
		lookupProject(appState, repositoryIdLookupService, data.ownerSlug, data.projectSlug)
	);
	const branch = $derived(
		isFound(repositoryId.current)
			? getBranchReview(appState, branchService, repositoryId.current.value, data.branchId)
			: undefined
	);

	const contributors = $derived(
		isFound(branch?.current)
			? getContributorsWithAvatars(branch.current.value)
			: Promise.resolve([])
	);

	function visitFirstCommit(branch: Branch) {
		if ((branch.patchIds?.length || 0) === 0) return;

		goto(projectReviewBranchCommitPath({ ...data, changeId: branch.patchIds[0] }));
	}
</script>

{#snippet startReview(branch: Branch)}
	{#if (branch.stackSize || 0) > 0}
		<Button style="pop" onclick={() => visitFirstCommit(branch)}>Start review</Button>
	{/if}
{/snippet}

<h2>Review page: {data.ownerSlug}/{data.projectSlug} {data.branchId}</h2>

<Loading loadable={and(repositoryId.current, branch?.current)}>
	{#snippet children(branch)}
		<div class="layout">
			<div class="information">
				<div class="heading">
					<p class="text-15 text-bold">{branch.title}</p>
					<div class="actions">
						<Button icon="plus" kind="outline">Add summary</Button>
						<Button icon="chain-link" kind="outline">Share link</Button>
						{@render startReview(branch)}
					</div>
				</div>
				<div class="stats">
					<Factoid title="Status:">
						<Badge>Perfect</Badge>
					</Factoid>
					<Factoid title="Commits:">
						<p>{branch.stackSize}</p>
					</Factoid>
					<Factoid title="Branch:">
						<LinkButton onclick={() => {}}>Perfect</LinkButton>
					</Factoid>
					<Factoid title="Authors:">
						{#await contributors then contributors}
							<AvatarGroup avatars={contributors}></AvatarGroup>
						{/await}
					</Factoid>
					<Factoid title="Updated:">
						<p>{dayjs(branch.updatedAt).fromNow()}</p>
					</Factoid>
					<Factoid title="Version:">
						<p>{branch.version}</p>
					</Factoid>
				</div>
				<div class="summary">
					{#if branch.description}
						<p class="text-13">{branch.description}</p>
					{:else}
						<p class="text-13 text-clr-2">No summary provided.</p>
						<p class="text-13 text-clr-2">
							<em>
								Summaries provide context on the branch's purpose and helps team members understand
								it's changes. <LinkButton onclick={() => {}}>Add summary</LinkButton>
							</em>
						</p>
					{/if}
				</div>
			</div>

			<table class="commits-table">
				<thead>
					<tr>
						<th>Status</th>
						<th>Name</th>
						<th>Changes</th>
						<th>Last update</th>
						<th>Authors</th>
						<th>Reviewers</th>
						<th>Comments</th>
					</tr>
				</thead>
				<tbody>
					{#each branch.patchIds || [] as changeId}
						<ChangeIndexCard {changeId} params={data} branchUuid={branch.uuid} />
					{/each}
				</tbody>
			</table>
		</div>
	{/snippet}
</Loading>

<style lang="postcss">
	.layout {
		display: grid;
		grid-template-columns: 5fr 11fr;
		gap: 16px;
	}

	.information {
		display: flex;
		gap: 24px;
		flex-direction: column;
	}

	.heading {
		display: flex;
		gap: 16px;
		flex-direction: column;
	}

	.summary {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.stats {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
	}

	.text-clr-2 {
		color: var(--clr-text-2);
	}

	.commits-table {
		th {
			text-align: left;
			padding: 16px;

			border-top: 1px solid var(--clr-border-2);
			border-bottom: 1px solid var(--clr-border-2);
			overflow: hidden;

			&:first-child {
				border-left: 1px solid var(--clr-border-2);
				border-top-left-radius: var(--radius-m);
			}

			&:last-child {
				border-right: 1px solid var(--clr-border-2);
				border-top-right-radius: var(--radius-m);
			}
		}
	}
</style>
