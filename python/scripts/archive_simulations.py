from scriptKeys import FM_JOB_IDS, LIDAR_JOB_ID
import archive_simulation as archive_scripts


def archive_simulations():
    for fm_job_id in FM_JOB_IDS:
        archive_scripts.archive_simulation(fm_job_id, 62, 31, 1)
    archive_scripts.archive_simulation(LIDAR_JOB_ID, 14, 7, 1)


if __name__ == "__main__":
    archive_simulations()
