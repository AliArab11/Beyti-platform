using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

[Table("ServiceCatalog")]

public partial class ServiceCatalog
{
    [Key]
    public int Id { get; set; }

    public int ServiceCategoryId { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = null!;

    [StringLength(255)]
    public string? Description { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal? MinPrice { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal? MaxPrice { get; set; }

    public int? EstimatedDuration { get; set; }

    public bool IsActive { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [InverseProperty("ServiceCatalog")]
    public virtual ICollection<ProviderApplicationService> ProviderApplicationServices { get; set; } = new List<ProviderApplicationService>();

    [InverseProperty("ServiceCatalog")]
    public virtual ICollection<Service> Services { get; set; } = new List<Service>();

    [InverseProperty("ServiceCatalog")]
    public virtual ICollection<ServiceBooking> ServiceBookings { get; set; } = new List<ServiceBooking>();

    [ForeignKey("ServiceCategoryId")]
    public virtual ServiceCategory ServiceCategory { get; set; } = null!;

}
